import { QpqFunctionRuntime } from '../../../../types';

/**
 * Change data capture on a store: the table gets a stream (NEW_AND_OLD_IMAGES) and
 * `runtime` is invoked with the changes.
 *
 * Records arrive in order PER PARTITION KEY, and different partition keys are processed
 * concurrently. A stream handler therefore gets one-writer-per-item serialisation for
 * free, which is what makes a stream the natural place to maintain a projection of a table
 * you only ever append to, no queue, no extra write on the append path, and no trigger to
 * lose, because the record exists precisely because the write happened.
 *
 * Mirrors defineStorageDrive's `onEvent`.
 */
export type KvsStreamSettings = {
  runtime: QpqFunctionRuntime;

  /**
   * Collapse each delivered batch down to ONE record per partition key, keeping the latest.
   *
   * Off by default: a generic consumer (audit trail, change notifications) needs to see
   * every change, and the framework should never silently drop records.
   *
   * On for a PROJECTION, where the payload that matters is "this key changed" and the
   * handler re-derives from source anyway. Without it, the batch is fanned back out into
   * one story run per record and the batching bought nothing: 500 appends to one document
   * would mean 500 re-derivations, each reading a log that grows as it goes. With it, that
   * batch is a single re-derivation.
   */
  coalesceByPartitionKey?: boolean;

  /** Records per invocation. DynamoDB streams allow up to 1000; the mapping default is 100. */
  batchSize?: number;

  /**
   * How long to wait accumulating records before invoking, 0 to 300 seconds. Trades
   * projection latency for far fewer invocations, and gives coalescing more to collapse.
   */
  maximumBatchingWindowInSeconds?: number;
};
