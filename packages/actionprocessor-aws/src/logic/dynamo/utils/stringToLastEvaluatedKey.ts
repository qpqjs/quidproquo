import { AttributeValue } from '@aws-sdk/client-dynamodb';

/**
 * Decode a client-supplied page key back into a DynamoDB ExclusiveStartKey.
 * The token is client-controlled and unauthenticated: nothing validates that
 * the decoded shape is a real key (DynamoDB rejects keys that do not match
 * the table's key schema), and a malformed token throws a SyntaxError.
 */
export function stringToLastEvaluatedKey(encodedKey: string): Record<string, AttributeValue> {
  return JSON.parse(Buffer.from(encodedKey, 'base64').toString());
}
