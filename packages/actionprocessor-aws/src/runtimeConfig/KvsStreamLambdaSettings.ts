import { QpqFunctionRuntime } from '@qpqjs/core';

/** What the kvs stream construct stamps onto its projector lambda; see KvsStreamSettings for the meaning of each. */
export type KvsStreamLambdaSettings = {
  // The store the stream belongs to.
  keyValueStoreName: string;
  // The handler every batch runs.
  runtime: QpqFunctionRuntime;
  // Collapse each batch to one record per partition key.
  coalesceByPartitionKey: boolean;
  // The table's partition key attribute, needed to coalesce and to split the scope off.
  partitionKey: string;
};
