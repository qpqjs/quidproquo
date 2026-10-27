import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askServiceFunctionExecute } from './askServiceFunctionExecute';
import { ServiceFunctionActionType } from './ServiceFunctionActionType';

describe('askServiceFunctionExecute', () => {
  it('yields an Execute action with the service, function, payload and async flag', () => {
    const { action } = captureRequester(askServiceFunctionExecute('billing', 'charge', { amount: 10 }, true));

    expect(action).toEqual({
      type: ServiceFunctionActionType.Execute,
      payload: { service: 'billing', functionName: 'charge', payload: { amount: 10 }, isAsync: true },
    });
  });

  it('defaults isAsync to false', () => {
    const { action } = captureRequester(askServiceFunctionExecute('billing', 'charge', {}));

    expect(action.payload.isAsync).toBe(false);
  });

  it('returns the execution result', () => {
    const { returned } = captureRequester(askServiceFunctionExecute('billing', 'charge', {}), { ok: true });

    expect(returned).toEqual({ ok: true });
  });
});
