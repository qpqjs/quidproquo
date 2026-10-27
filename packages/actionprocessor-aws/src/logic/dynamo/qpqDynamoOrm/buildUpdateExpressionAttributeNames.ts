import { KvsUpdate } from 'quidproquo-core';

import { getItemName } from './getItemName';

/**
 * Collect the #placeholder -> attribute-name map for every string segment of
 * every update's attribute path (numeric segments are list indexes and are
 * rendered inline, not as names). Does not modify the given updates.
 */
export const buildUpdateExpressionAttributeNames = (updates: KvsUpdate): Record<string, string> => {
  const attributeNames: Record<string, string> = {};

  for (const update of updates) {
    const segments = Array.isArray(update.attributePath) ? update.attributePath : [update.attributePath];

    for (const segment of segments) {
      if (typeof segment === 'string') {
        attributeNames[getItemName(segment)] = segment;
      }
    }
  }

  return attributeNames;
};
