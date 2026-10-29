import { KvsLogicalOperator, KvsQueryOperation } from '@qpqjs/core';

/**
 *
 */
export const isKvsLogicalOperator = (query: KvsQueryOperation): query is KvsLogicalOperator => {
  return 'conditions' in query && 'operation' in query;
};
