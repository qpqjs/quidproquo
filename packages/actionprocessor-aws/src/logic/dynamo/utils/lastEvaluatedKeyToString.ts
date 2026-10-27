import { AttributeValue } from '@aws-sdk/client-dynamodb';

/** Encode a DynamoDB LastEvaluatedKey as an opaque page-key string for clients. */
export function lastEvaluatedKeyToString(lastEvaluatedKey: Record<string, AttributeValue>): string {
  return Buffer.from(JSON.stringify(lastEvaluatedKey)).toString('base64');
}
