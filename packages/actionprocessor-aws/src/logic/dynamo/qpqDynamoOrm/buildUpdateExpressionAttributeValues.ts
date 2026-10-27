import { KvsUpdate } from 'quidproquo-core';

import { AttributeValue } from '@aws-sdk/client-dynamodb';

import { buildAttributeValue } from './buildAttributeValue';
import { getValueName } from './getValueName';

/**
 * Collect the :placeholder -> AttributeValue map for every value (and
 * Increment defaultValue) referenced by the given updates. Returns undefined
 * (not null) when empty so it can feed the optional
 * ExpressionAttributeValues SDK field directly.
 */
export const buildUpdateExpressionAttributeValues = (updates: KvsUpdate): Record<string, AttributeValue> | undefined => {
  const attributeValues: Record<string, AttributeValue> = {};

  for (const update of updates) {
    if (update.value !== undefined && update.value !== null) {
      attributeValues[getValueName(update.value)] = buildAttributeValue(update.value);
    }

    if (update.defaultValue !== undefined && update.defaultValue !== null) {
      attributeValues[getValueName(update.defaultValue)] = buildAttributeValue(update.defaultValue);
    }
  }

  return Object.keys(attributeValues).length > 0 ? attributeValues : undefined;
};
