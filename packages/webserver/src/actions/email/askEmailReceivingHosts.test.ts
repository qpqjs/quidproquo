import { captureRequester } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { askEmailReceivingHosts } from './askEmailReceivingHosts';
import { EmailActionType } from './EmailActionType';

describe('askEmailReceivingHosts', () => {
  it('yields a ReceivingHosts action with no payload', () => {
    const { action } = captureRequester(askEmailReceivingHosts());

    expect(action).toEqual({ type: EmailActionType.ReceivingHosts });
  });
});
