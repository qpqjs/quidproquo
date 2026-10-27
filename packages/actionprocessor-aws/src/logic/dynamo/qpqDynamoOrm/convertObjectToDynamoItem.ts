import { KvsObjectDataType } from 'quidproquo-core';

import { AttributeValue } from '@aws-sdk/client-dynamodb';

import { buildAttributeValue } from './buildAttributeValue';

// Root items must be objects. A root-level list is technically storable, but
// DynamoDB cannot conditionally update or delete individual list elements,
// and a root list is usually better modelled as its own table.
export const convertObjectToDynamoItem = (obj: KvsObjectDataType): Record<string, AttributeValue> => {
  return buildAttributeValue(obj).M!;
};
