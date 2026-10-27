import { KvsLogicalOperator, KvsQueryOperation } from 'quidproquo-core';

export const isKvsLogicalOperator = (query: KvsQueryOperation): query is KvsLogicalOperator => {
  return 'conditions' in query && 'operation' in query;
};
