import { ErrorTypeEnum } from 'quidproquo-core';
import { ServiceActionType } from 'quidproquo-features';

import { describe, expect, it, vi } from 'vitest';

import { getServiceRequestActionProcessor } from './getServiceRequestActionProcessor';

const payload = { serviceName: 'svc', method: 'doThing', payload: { a: 1 } };

describe('getServiceRequestActionProcessor', () => {
  it('sends a correlated service request event and returns the result', async () => {
    const sendEvent = vi.fn().mockResolvedValue({ success: true, result: { ok: true } });
    const processor = getServiceRequestActionProcessor({ current: sendEvent })[ServiceActionType.Request];

    const result = await processor(payload, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);

    expect(sendEvent).toHaveBeenCalledWith({ type: 'qpq/serviceRequest/svc/doThing', payload: { a: 1 } });
    expect(result).toEqual([{ ok: true }]);
  });

  it('maps a failed response to an action result error', async () => {
    const sendEvent = vi.fn().mockResolvedValue({
      success: false,
      error: { errorType: ErrorTypeEnum.GenericError, errorText: 'nope', errorStack: 'stack' },
    });
    const processor = getServiceRequestActionProcessor({ current: sendEvent })[ServiceActionType.Request];

    const result = await processor(payload, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);

    expect(result).toEqual([undefined, { errorType: ErrorTypeEnum.GenericError, errorText: 'nope', errorStack: 'stack' }]);
  });

  it('returns an undefined result when there is no sender', async () => {
    const processor = getServiceRequestActionProcessor({ current: null })[ServiceActionType.Request];

    const result = await processor(payload, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any);

    expect(result).toEqual([undefined]);
  });
});
