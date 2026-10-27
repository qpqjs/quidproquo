import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, buildTestStorySession, defineEventBus, ErrorTypeEnum, EventBusActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { publishMessage } from '../../../logic/sns/publishMessage';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getEventBusSendMessagesActionProcessor } from './getEventBusSendMessagesActionProcessor';

vi.mock('../../../logic/sns/publishMessage', () => ({
  publishMessage: vi.fn(),
}));

const resolveProcessor = async (extraSettings: any[] = []) => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), ...extraSettings]);
  const processors = await getEventBusSendMessagesActionProcessor(config, {} as any);
  return processors[EventBusActionType.SendMessages];
};

describe('getEventBusSendMessagesActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(publishMessage).mockReset();
  });

  it('returns a NotFound error when the event bus is not configured', async () => {
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(processor, { eventBusName: 'missing', eventBusMessages: [] }, { session: buildTestStorySession() });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('publishes each message to the resolved sns topic arn', async () => {
    const processor = await resolveProcessor([defineEventBus('orders')]);

    const result = await invokeProcessor(
      processor,
      { eventBusName: 'orders', eventBusMessages: [{ payload: { ok: true } }] },
      { session: buildTestStorySession() },
    );

    expect(result).toEqual([undefined]);
    const [topicArn, region, entries] = vi.mocked(publishMessage).mock.calls[0];
    expect(topicArn).toBe('arn:aws:sns:eu-west-1:111:orders-test-app-test-module-development');
    expect(region).toBe('eu-west-1');
    expect(entries[0].groupId).toBeUndefined();
    expect(entries[0].deduplicationId).toBeUndefined();
    expect(JSON.parse(entries[0].message)).toEqual({ payload: { ok: true }, storySession: buildTestStorySession() });
  });

  it('resolves a .fifo topic arn and defaults groupId/deduplicationId for a FIFO bus', async () => {
    const processor = await resolveProcessor([defineEventBus('orders', { isFifo: true })]);

    await invokeProcessor(processor, { eventBusName: 'orders', eventBusMessages: [{ payload: { ok: true } }] }, { session: buildTestStorySession() });

    const [topicArn, , entries] = vi.mocked(publishMessage).mock.calls[0];
    expect(topicArn).toBe('arn:aws:sns:eu-west-1:111:orders-test-app-test-module-development.fifo');
    expect(entries[0].groupId).toBe('orders');
    expect(entries[0].deduplicationId).toEqual(expect.any(String));
  });

  it('passes explicit groupId and deduplicationId through for a FIFO bus', async () => {
    const processor = await resolveProcessor([defineEventBus('orders', { isFifo: true })]);

    await invokeProcessor(
      processor,
      { eventBusName: 'orders', eventBusMessages: [{ payload: { ok: true }, groupId: 'user-42', deduplicationId: 'dedup-1' }] },
      { session: buildTestStorySession() },
    );

    const [, , entries] = vi.mocked(publishMessage).mock.calls[0];
    expect(entries[0].groupId).toBe('user-42');
    expect(entries[0].deduplicationId).toBe('dedup-1');
  });
});
