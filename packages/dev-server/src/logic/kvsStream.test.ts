import { buildTestQpqConfig, defineKeyValueStore, kvsKey, KvsStreamEventType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { eventBus } from './eventBus';
import { emitKvsStreamEvent, KVS_STREAM_EVENT_TOPIC } from './kvsStream';

const STREAMED = 'streamed';
const PLAIN = 'plain';
const RUNTIME = '/entry/kvsStream/project::project';

const qpqConfig = buildTestQpqConfig([
  defineKeyValueStore(STREAMED, kvsKey('pk', 'string'), [], { onStream: { runtime: RUNTIME as any } }),
  defineKeyValueStore(PLAIN, kvsKey('pk', 'string')),
]);

const session = { correlation: 'test', context: {} } as any;

const emit = (keyValueStoreName: string) =>
  emitKvsStreamEvent(qpqConfig, session, {
    keyValueStoreName,
    eventType: KvsStreamEventType.Insert,
    scope: 'tenant-a',
    keys: { pk: 'doc-1' },
    newImage: { pk: 'doc-1' },
  });

describe('emitKvsStreamEvent', () => {
  const published = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    eventBus.removeAllListeners(KVS_STREAM_EVENT_TOPIC);
    eventBus.on(KVS_STREAM_EVENT_TOPIC, published);
  });

  it('publishes nothing for a store that declares no stream handler', async () => {
    // Every write calls the emitter, so this is what stops an ordinary store paying for a
    // handler run it never asked for.
    await emit(PLAIN);

    expect(published).not.toHaveBeenCalled();
  });

  it('publishes the record and the store’s configured handler', async () => {
    await emit(STREAMED);

    expect(published).toHaveBeenCalledTimes(1);

    const [message] = published.mock.calls[0];
    expect(message.runtime).toBe(RUNTIME);
    expect(message.record).toEqual({
      keyValueStoreName: STREAMED,
      eventType: KvsStreamEventType.Insert,
      scope: 'tenant-a',
      keys: { pk: 'doc-1' },
      newImage: { pk: 'doc-1' },
      oldImage: undefined,
    });
  });

  it('strips service-local context off the session, like any other cross-boundary send', async () => {
    await emitKvsStreamEvent(qpqConfig, { ...session, localContext: { secret: 'nope' } } as any, {
      keyValueStoreName: STREAMED,
      eventType: KvsStreamEventType.Insert,
      keys: { pk: 'doc-1' },
    });

    expect(published.mock.calls[0][0].storySession.localContext).toBeUndefined();
  });
});
