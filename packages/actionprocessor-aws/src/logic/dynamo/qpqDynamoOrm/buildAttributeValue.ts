import { KvsAdvancedDataType } from 'quidproquo-core';

import { AttributeValue } from '@aws-sdk/client-dynamodb';

/**
 * Convert a kvs value to its DynamoDB AttributeValue form. Recurses into
 * arrays and objects; object members with an undefined value are dropped
 * (DynamoDB has no representation for undefined).
 */
export const buildAttributeValue = (value: KvsAdvancedDataType): AttributeValue => {
  const valueType = typeof value;
  switch (valueType) {
    case 'string':
      return { S: value as string };

    case 'number':
      return { N: (value as number).toString() };

    case 'boolean':
      return { BOOL: value as boolean };

    case 'object':
      if (Array.isArray(value)) {
        return {
          L: value.map((item) => buildAttributeValue(item)),
        };
      } else if (value !== null) {
        const objectKeyValuePairs = Object.entries(value)
          .filter(([, memberValue]) => memberValue !== undefined)
          .map(([memberKey, memberValue]) => [memberKey, buildAttributeValue(memberValue)]);

        return {
          M: Object.fromEntries(objectKeyValuePairs),
        };
      } else {
        return { NULL: true };
      }
    default:
      throw new Error(`Unsupported data type in kvs expression: ${valueType}`);
  }
};
