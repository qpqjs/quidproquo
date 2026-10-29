import { StateActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { AuthEffect } from '../effects/AuthEffect';
import { askAuthUISetPassword } from './askAuthUISetPassword';

describe('askAuthUISetPassword', () => {
  it('dispatches a SetPassword effect', () => {
    const { action } = captureRequester(askAuthUISetPassword('secret'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthEffect.SetPassword, payload: 'secret' } },
    });
  });
});
