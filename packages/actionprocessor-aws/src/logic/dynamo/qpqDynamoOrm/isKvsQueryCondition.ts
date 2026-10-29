import { KvsQueryCondition, KvsQueryOperation } from '@qpqjs/core';

export const isKvsQueryCondition = (query: KvsQueryOperation): query is KvsQueryCondition => {
  return 'key' in query && 'operation' in query;
};
