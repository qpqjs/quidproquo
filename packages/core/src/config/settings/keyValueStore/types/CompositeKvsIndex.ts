import { KeyOf } from '../../../../types';
import { KvsKey } from './KvsKey';

// A key given either as a bare attribute name (a string key) or in full.
export type CompositeKvsKey<T extends object = any> = KvsKey<T> | KeyOf<T>;

export type CompositeCompositeKvsIndex<T extends object = any> = {
  // Defaults to the partition key attribute. Name an index when two share a partition key.
  name?: string;
  partitionKey: CompositeKvsKey<T>;
  sortKey?: CompositeKvsKey<T>;
};

export type CompositeKvsIndex<T extends object = any> = KeyOf<T> | CompositeCompositeKvsIndex<T>;
