import { KvsStreamEventType, KvsStreamRecord, QPQConfig, qpqCoreUtils, StorySession, toCrossServiceSession } from 'quidproquo-core';

import { KvsStreamMessageWithSession } from '../actionProcessor/core/event/kvsStream/types';
import { eventBus } from './eventBus';

// In-process channel between "a store was written" and "run its stream handler".
export const KVS_STREAM_EVENT_TOPIC = 'qpq/devServer/kvsStream';

export type KvsStreamEmission = {
  keyValueStoreName: string;
  eventType: KvsStreamEventType;
  scope?: string;
  keys: Record<string, unknown>;
  newImage?: Record<string, unknown>;
  oldImage?: Record<string, unknown>;
};

/**
 * Local stand-in for a key-value store's change stream.
 *
 * Deployed, DynamoDB emits a change record and Lambda delivers batches of them. There is no
 * such machinery locally, so the KVS backend calls this after a mutating write. Without it
 * `go:dev` would silently stop running stream handlers, and anything that has moved onto a
 * projection (an eventDoc summary, for one) would go stale locally while looking perfectly
 * healthy deployed. A dev server that quietly does less than production is worse than one
 * that does not support the feature at all.
 *
 * Publishes onto the in-process bus rather than invoking the handler directly, for the same
 * reason the queue send processor does: running a handler means running every action
 * processor, and a processor that reaches for that directly would import the whole set,
 * including itself. The bus is what keeps the write path and the handler path apart.
 *
 * Deliberate differences from the deployed path, none of which change the outcome:
 *
 * - ONE record per write. There is no batching, so `coalesceByPartitionKey` has nothing to
 *   collapse and a burst of writes runs the handler once each. Slower, never wrong: handlers
 *   have to be idempotent to survive stream retries anyway.
 * - Keys and images are already raw. The sqlite engine stores items verbatim and partitions
 *   by scope at the ROW level, so there is no composed partition key to take apart the way
 *   the DynamoDB processor must. The scope travels as its own field instead, which lands the
 *   handler in exactly the same shape.
 */
export const emitKvsStreamEvent = async (qpqConfig: QPQConfig, session: StorySession, emission: KvsStreamEmission): Promise<void> => {
  const onStream = qpqCoreUtils.getKeyValueStoreByName(qpqConfig, emission.keyValueStoreName)?.onStream;

  if (!onStream) {
    return;
  }

  const record: KvsStreamRecord = {
    keyValueStoreName: emission.keyValueStoreName,
    eventType: emission.eventType,
    scope: emission.scope,
    keys: emission.keys,
    newImage: emission.newImage,
    oldImage: emission.oldImage,
  };

  const message: KvsStreamMessageWithSession = {
    storySession: toCrossServiceSession(session),
    record,
    runtime: onStream.runtime,
  };

  await eventBus.publish(KVS_STREAM_EVENT_TOPIC, message);
};
