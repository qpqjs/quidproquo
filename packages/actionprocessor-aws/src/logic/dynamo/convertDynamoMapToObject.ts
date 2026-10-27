import { AttributeValue } from '@aws-sdk/client-dynamodb';

const convertDynamoAttributeToValue = (value: AttributeValue): unknown => {
  const valueType = Object.keys(value)[0];

  switch (valueType) {
    case 'S':
      return value.S;
    case 'N':
      return parseFloat(value.N!);
    case 'BOOL':
      return value.BOOL;
    case 'NULL':
      return null;
    case 'L':
      return value.L!.map((item) => convertDynamoAttributeToValue(item));
    case 'M':
      return convertDynamoMapToObject(value.M!);
    default:
      throw new Error(`Unsupported DynamoDB data type: ${valueType}`);
  }
};

/**
 * Unmarshal a DynamoDB attribute map back into a plain js object. Supports
 * the types buildAttributeValue can produce (S, N, BOOL, NULL, L, M) and
 * throws on anything else. A missing map unmarshals to an empty object.
 */
export function convertDynamoMapToObject(dynamoMap?: Record<string, AttributeValue>): Record<string, unknown> {
  const obj: Record<string, unknown> = {};

  for (const property in dynamoMap) {
    obj[property] = convertDynamoAttributeToValue(dynamoMap[property]);
  }

  return obj;
}
