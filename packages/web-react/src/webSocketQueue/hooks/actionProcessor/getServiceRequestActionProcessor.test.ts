import { ActionProcessor, ErrorTypeEnum, Nullable } from '@qpqjs/core';
import { ServiceActionType } from '@qpqjs/features';
import { buildTestQpqConfig, invokeProcessor, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { getServiceRequestActionProcessor } from './getServiceRequestActionProcessor';

const payload = { serviceName: 'svc', method: 'doThing', payload: { a: 1 } };

const resolve = async (sendEvent: Nullable<(event: unknown) => Promise<any>>): Promise<ActionProcessor<any>> => {
  const processors = await getServiceRequestActionProcessor({ current: sendEvent })(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[ServiceActionType.Request]!;
};

describe('getServiceRequestActionProcessor', () => {
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

  it('returns an undefined result when there is no sender', async () => {
    const result = await invokeProcessor(await resolve(null), payload);

    expect(result).toEqual([undefined]);
  });
});
