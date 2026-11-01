import { CompositeKvsKey } from './CompositeKvsKey';

/** An index written out in full, with each key given as a bare attribute name or in full. */
export type CompositeCompositeKvsIndex<T extends object = any> = {
  // Defaults to the partition key attribute. Name an index when two share a partition key.
  name?: string;
  partitionKey: CompositeKvsKey<T>;
  sortKey?: CompositeKvsKey<T>;
};
