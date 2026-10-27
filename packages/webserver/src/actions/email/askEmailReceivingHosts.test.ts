import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askEmailReceivingHosts } from './askEmailReceivingHosts';
import { EmailActionType } from './EmailActionType';

describe('askEmailReceivingHosts', () => {
  it('yields a ReceivingHosts action with an empty payload', () => {
    const { action } = captureRequester(askEmailReceivingHosts());

    expect(action).toEqual({ type: EmailActionType.ReceivingHosts, payload: {} });
  });
});
