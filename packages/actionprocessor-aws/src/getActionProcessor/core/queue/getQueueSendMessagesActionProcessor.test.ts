import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { defineQueue, QPQConfigItem, QueueActionType } from '@qpqjs/core';
import { buildTestQpqConfig, buildTestStorySession, invokeProcessor } from '@qpqjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sendMessages } from '../../../logic/sqs/sendMessages';
import { getQueueSendMessagesActionProcessor } from './getQueueSendMessagesActionProcessor';

vi.mock('../../../logic/sqs/sendMessages', () => ({
  sendMessages: vi.fn(),
}));

const resolveProcessor = async (extraSettings: QPQConfigItem[] = []) => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), ...extraSettings]);
  const processors = await getQueueSendMessagesActionProcessor(config, {} as any);
  return processors[QueueActionType.SendMessages];
};

describe('getQueueSendMessagesActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(sendMessages).mockReset();
  });

  it('sends each message to the resolved queue with the session attached', async () => {
    const processor = await resolveProcessor();

    const result = await invokeProcessor(
      processor,
      { queueName: 'jobs', queueMessages: [{ payload: { a: 1 } }] },
      { session: buildTestStorySession() },
    );

    expect(result).toEqual([undefined]);
    const [queueName, region, entries] = vi.mocked(sendMessages).mock.calls[0];
    expect(queueName).toBe('jobs-test-app-test-module-development');
    expect(region).toBe('eu-west-1');
    expect(entries[0].groupId).toBeUndefined();
    expect(entries[0].deduplicationId).toBeUndefined();
    expect(JSON.parse(entries[0].body)).toEqual({ payload: { a: 1 }, storySession: buildTestStorySession() });
  });

  // Security regression: the body that lands in SQS carries the cross-service session only, never the raw bearer
  // token, local context or function globals of the sending story.
  it('strips the token, local context and function globals from the session it sends', async () => {
    const processor = await resolveProcessor();
    const session = {
      ...buildTestStorySession(),
      accessToken: 'raw-bearer-token',
      localContext: { secretThing: 'x' },
      functionGlobals: { apiKey: 'k' },
    } as any;

    await invokeProcessor(processor, { queueName: 'jobs', queueMessages: [{ payload: {} }] }, { session });

    const [, , entries] = vi.mocked(sendMessages).mock.calls[0];
    const sent = JSON.parse(entries[0].body).storySession;
    expect(sent.accessToken).toBeUndefined();
    expect(sent.localContext).toBeUndefined();
    expect(sent.functionGlobals).toBeUndefined();
    expect(entries[0].body).not.toContain('raw-bearer-token');
  });

  it('resolves a .fifo name and defaults groupId/deduplicationId for a FIFO queue', async () => {
    const processor = await resolveProcessor([defineQueue('jobs', {}, { isFifo: true })]);

    await invokeProcessor(processor, { queueName: 'jobs', queueMessages: [{ payload: { a: 1 } }] }, { session: buildTestStorySession() });

    const [queueName, , entries] = vi.mocked(sendMessages).mock.calls[0];
    expect(queueName).toBe('jobs-test-app-test-module-development.fifo');
    expect(entries[0].groupId).toBe('jobs');
    expect(entries[0].deduplicationId).toEqual(expect.any(String));
  });

  it('passes explicit groupId and deduplicationId through for a FIFO queue', async () => {
    const processor = await resolveProcessor([defineQueue('jobs', {}, { isFifo: true })]);

    await invokeProcessor(
      processor,
      { queueName: 'jobs', queueMessages: [{ payload: { a: 1 }, groupId: 'user-42', deduplicationId: 'dedup-1' }] },
      { session: buildTestStorySession() },
    );

    const [, , entries] = vi.mocked(sendMessages).mock.calls[0];
    expect(entries[0].groupId).toBe('user-42');
    expect(entries[0].deduplicationId).toBe('dedup-1');
  });
});
