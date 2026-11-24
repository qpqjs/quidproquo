import { ActionProcessor, ErrorTypeEnum, Nullable } from '@qpqjs/core';
import { askServiceRequestBase, ServiceActionType } from '@qpqjs/features';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { getServiceRequestActionProcessor } from './getServiceRequestActionProcessor';

const payload = { serviceName: 'svc', method: 'doThing', payload: { a: 1 } };

const resolve = async (sendEvent: Nullable<(event: unknown) => Promise<any>>): Promise<ActionProcessor<any>> => {
  const processors = await getServiceRequestActionProcessor({ current: sendEvent })(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[ServiceActionType.Request]!;
};

describe('getServiceRequestActionProcessor', () => {
  afterEach(() => vi.useRealTimers());

  it('sends a correlated service request event and returns the result', async () => {
    const sendEvent = vi.fn().mockResolvedValue({ success: true, result: { ok: true } });

    const result = await invokeProcessor(await resolve(sendEvent), payload);

    expect(sendEvent).toHaveBeenCalledWith({ type: 'qpq/serviceRequest/svc/doThing', payload: { a: 1 } });
    expect(result).toEqual([{ ok: true }]);
  });

  it('maps a failed response to an action result error', async () => {
    const sendEvent = vi.fn().mockResolvedValue({
      success: false,
      error: { errorType: ErrorTypeEnum.GenericError, errorText: 'nope', errorStack: 'stack' },
    });

    const result = await invokeProcessor(await resolve(sendEvent), payload);

    expect(result).toEqual([undefined, { errorType: ErrorTypeEnum.GenericError, errorText: 'nope', errorStack: 'stack' }]);
  });

  it('fails with Timeout when a time limit is set and no response arrives', async () => {
    vi.useFakeTimers();
    const sendEvent = vi.fn().mockReturnValue(new Promise(() => undefined));

    const pending = invokeProcessor(await resolve(sendEvent), { ...payload, timeoutMs: 30_000 });
    await vi.advanceTimersByTimeAsync(30_000);

    expect(await pending).toEqual([undefined, expect.objectContaining({ errorType: askServiceRequestBase.errorType.Timeout })]);
  });

  it('returns the response when it arrives inside the time limit', async () => {
    const sendEvent = vi.fn().mockResolvedValue({ success: true, result: { ok: true } });

    const result = await invokeProcessor(await resolve(sendEvent), { ...payload, timeoutMs: 30_000 });

    expect(result).toEqual([{ ok: true }]);
  });

  it('returns an undefined result when there is no sender', async () => {
    const result = await invokeProcessor(await resolve(null), payload);

    expect(result).toEqual([undefined]);
  });
});
