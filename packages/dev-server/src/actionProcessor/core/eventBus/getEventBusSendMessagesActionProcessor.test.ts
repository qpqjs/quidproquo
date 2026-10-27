import {
  buildTestQpqConfig,
  defineEventBus,
  ErrorTypeEnum,
  EventBusActionType,
  isErroredActionResult,
  noopDynamicModuleLoader,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { eventBus } from '../../../logic/eventBus';
import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getEventBusSendMessagesActionProcessor } from './getEventBusSendMessagesActionProcessor';

vi.mock('../../../logic/eventBus', () => ({
  eventBus: { publish: vi.fn(), publishAndWaitForResponse: vi.fn() },
}));

const buildConfig = () => buildTestQpqConfig([defineEventBus('myBus')]);

const getProcessor = async (config = buildConfig()) => {
  const processors = await getEventBusSendMessagesActionProcessor(config, noopDynamicModuleLoader);
  return processors[EventBusActionType.SendMessages];
};

describe('getEventBusSendMessagesActionProcessor', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns NotFound when the event bus is unknown', async () => {
    const process = await getProcessor();

    const result = await invokeProcessor(process, { eventBusName: 'missing', eventBusMessages: [] });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.NotFound);
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('publishes one event per message and returns success', async () => {
    const process = await getProcessor();

    const result = await invokeProcessor(process, {
      eventBusName: 'myBus',
      eventBusMessages: [
        { payload: { a: 1 }, type: 'x' },
        { payload: { a: 2 }, type: 'y' },
      ],
    });

    expect(resolveActionResult(result)).toBeUndefined();
    expect(eventBus.publish).toHaveBeenCalledTimes(2);
    expect(eventBus.publish).toHaveBeenCalledWith(
      EventBusActionType.SendMessages,
      expect.objectContaining({
        payload: { a: 1 },
        type: 'x',
        eventBusName: 'myBus',
        targetModule: expect.any(String),
        targetApplication: expect.any(String),
        targetEnvironment: expect.any(String),
      }),
    );
  });

  it('leaves groupId unset for non-FIFO buses', async () => {
    const process = await getProcessor();

    await invokeProcessor(process, { eventBusName: 'myBus', eventBusMessages: [{ payload: {}, type: 'x' }] });

    expect(vi.mocked(eventBus.publish).mock.calls[0][1].groupId).toBeUndefined();
  });

  it('defaults groupId to the bus name for FIFO buses', async () => {
    const process = await getProcessor(buildTestQpqConfig([defineEventBus('fifoBus', { isFifo: true })]));

    await invokeProcessor(process, {
      eventBusName: 'fifoBus',
      eventBusMessages: [
        { payload: {}, type: 'x' },
        { payload: {}, type: 'y', groupId: 'user-42' },
      ],
    });

    expect(vi.mocked(eventBus.publish).mock.calls[0][1].groupId).toBe('fifoBus');
    expect(vi.mocked(eventBus.publish).mock.calls[1][1].groupId).toBe('user-42');
  });

  it('drops FIFO messages with a deduplicationId seen within the dedup window', async () => {
    const process = await getProcessor(buildTestQpqConfig([defineEventBus('fifoBus', { isFifo: true })]));

    await invokeProcessor(process, {
      eventBusName: 'fifoBus',
      eventBusMessages: [
        { payload: { a: 1 }, type: 'x', deduplicationId: 'bus-dedup-1' },
        { payload: { a: 2 }, type: 'x', deduplicationId: 'bus-dedup-1' },
      ],
    });

    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(vi.mocked(eventBus.publish).mock.calls[0][1].payload).toEqual({ a: 1 });
  });
});
