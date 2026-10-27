import { SNSEventRecord } from 'aws-lambda';

/**
 * True when an SNS record is a lambda warmer ping published by the bootstrap
 * warmer schedule (BSQpqLambdaWarmerEventConstruct sends `{ type: 'QpqLambdaWarmerEvent' }`).
 */
export const isSnsWarmerRecord = (record: SNSEventRecord): boolean => {
  if (record.EventSource !== 'aws:sns') {
    return false;
  }

  // Message is whatever the topic's publisher sent; a non-JSON or non-object
  // message is simply not a warmer, it must not crash the invoke.
  try {
    const message: unknown = JSON.parse(record.Sns.Message);
    return typeof message === 'object' && message !== null && (message as { type?: unknown }).type === 'QpqLambdaWarmerEvent';
  } catch {
    return false;
  }
};
