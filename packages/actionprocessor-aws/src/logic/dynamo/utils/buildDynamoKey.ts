import { KvsCoreDataType } from 'quidproquo-core';

import { AttributeValue } from '@aws-sdk/client-dynamodb';

import { buildAttributeValue } from '../qpqDynamoOrm/buildAttributeValue';

/**
 * Build the Key map for a Get/Delete/Update item command. The sort key is
 * included whenever its name is given and the value is defined (falsy values
 * like 0 and '' are valid sort keys).
 */
export const buildDynamoKey = (
  keyName: string,
  key: KvsCoreDataType,
  sortKeyName?: string,
  sortKey?: KvsCoreDataType,
): Record<string, AttributeValue> => {
  const dynamoKey: Record<string, AttributeValue> = {
    [keyName]: buildAttributeValue(key),
  };

  if (sortKeyName && sortKey !== undefined) {
    dynamoKey[sortKeyName] = buildAttributeValue(sortKey);
  }

  return dynamoKey;
};
