import { KvsQueryCondition, KvsQueryOperation } from '../../actions/keyValueStore/types';

/** Flatten a query tree into its leaf conditions, in traversal order. Malformed nodes are dropped. */
export const flattenKvsQueryConditions = (operation: KvsQueryOperation): KvsQueryCondition[] => {
  if ('key' in operation && 'operation' in operation) {
    return [operation];
  }

  if ('conditions' in operation && 'operation' in operation) {
    return operation.conditions.flatMap(flattenKvsQueryConditions);
  }

  return [];
};
