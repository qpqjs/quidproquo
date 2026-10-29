import { StateActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { AuthEffect } from '../effects/AuthEffect';
import { askAuthSetUsername } from './askAuthSetUsername';

describe('askAuthSetUsername', () => {
  it('dispatches a SetUsername effect', () => {
    const { action } = captureRequester(askAuthSetUsername('joe'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthEffect.SetUsername, payload: 'joe' } },
    });
  });
});
