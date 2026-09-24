import { flattenKvsQueryConditions, KvsQueryOperation } from 'quidproquo-core';

import { getItemName } from './getItemName';

/**
 * Collect the #placeholder -> attribute-name map for every key referenced by
 * the given query expressions. Returns undefined (not null) when empty so it
 * can feed the optional ExpressionAttributeNames SDK field directly.
 */
export const buildExpressionAttributeNames = (queries: (KvsQueryOperation | undefined)[]): Record<string, string> | undefined => {
  const names: Record<string, string> = {};

  for (const query of queries) {
    if (!query) {
      continue;
    }

    for (const condition of flattenKvsQueryConditions(query)) {
      names[getItemName(condition.key)] = condition.key;
    }
  }

  return Object.keys(names).length > 0 ? names : undefined;
};
