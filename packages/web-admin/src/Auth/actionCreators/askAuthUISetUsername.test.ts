import { StateActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { AuthEffect } from '../effects/AuthEffect';
import { askAuthUISetUsername } from './askAuthUISetUsername';

describe('askAuthUISetUsername', () => {
  it('dispatches a SetUsername effect', () => {
    const { action } = captureRequester(askAuthUISetUsername('joe'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthEffect.SetUsername, payload: 'joe' } },
    });
  });
});
