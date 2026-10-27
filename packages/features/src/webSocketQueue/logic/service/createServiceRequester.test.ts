import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { createServiceRequester } from './createServiceRequester';
import { ServiceActionType } from './ServiceActionType';

describe('createServiceRequester', () => {
  it('exposes the service name and method metadata', () => {
    const requester = createServiceRequester<{ amount: number }, { ok: boolean }>('billing', 'charge');

    expect(requester.serviceRequest).toEqual({ serviceName: 'billing', method: 'charge' });
  });

  it('yields a Request action delegating to askServiceRequest', () => {
    const requester = createServiceRequester<{ amount: number }>('billing', 'charge');
    const { action } = captureRequester(requester({ amount: 10 }));

    expect(action).toEqual({
      type: ServiceActionType.Request,
      payload: { serviceName: 'billing', method: 'charge', payload: { amount: 10 } },
    });
  });
});
