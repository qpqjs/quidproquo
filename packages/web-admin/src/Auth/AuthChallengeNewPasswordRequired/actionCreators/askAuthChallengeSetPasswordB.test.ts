import { StateActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { AuthChallengeEffect } from '../effects/AuthChallengeEffect';
import { askAuthChallengeSetPasswordB } from './askAuthChallengeSetPasswordB';

describe('askAuthChallengeSetPasswordB', () => {
  it('dispatches a SetPasswordB effect', () => {
    const { action } = captureRequester(askAuthChallengeSetPasswordB('b'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthChallengeEffect.SetPasswordB, payload: 'b' } },
    });
  });
});
