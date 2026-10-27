import { SNSEventRecord } from 'aws-lambda';
import { describe, expect, it } from 'vitest';

import { isSnsWarmerRecord } from './isSnsWarmerRecord';

const buildRecord = (eventSource: string, message: string): SNSEventRecord =>
  ({
    EventSource: eventSource,
    Sns: { Message: message },
  }) as SNSEventRecord;

describe('isSnsWarmerRecord', () => {
  it('recognises the warmer ping published by the bootstrap warmer schedule', () => {
    expect(isSnsWarmerRecord(buildRecord('aws:sns', JSON.stringify({ type: 'QpqLambdaWarmerEvent' })))).toBe(true);
  });

  it('is false for a non-sns record', () => {
    expect(isSnsWarmerRecord(buildRecord('aws:sqs', JSON.stringify({ type: 'QpqLambdaWarmerEvent' })))).toBe(false);
  });

  it('is false for an sns message with a different type', () => {
    expect(isSnsWarmerRecord(buildRecord('aws:sns', JSON.stringify({ type: 'SomethingElse' })))).toBe(false);
  });

  it('treats a non-JSON sns message as not a warmer instead of throwing', () => {
    expect(isSnsWarmerRecord(buildRecord('aws:sns', 'plain text, not json'))).toBe(false);
  });

  it('treats a JSON message without an object body as not a warmer instead of throwing', () => {
    expect(isSnsWarmerRecord(buildRecord('aws:sns', 'null'))).toBe(false);
  });
});
