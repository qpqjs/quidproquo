import { captureRequester, StateActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askAuthChallengeSetPasswordA, askAuthChallengeSetPasswordB } from './authActionCreator';
import { AuthChallengeEffect } from './authChallengeTypes';

describe('askAuthChallengeSetPasswordA', () => {
  it('dispatches a SetPasswordA effect', () => {
    const { action } = captureRequester(askAuthChallengeSetPasswordA('a'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthChallengeEffect.SetPasswordA, payload: 'a' } },
    });
  });
});

describe('askAuthChallengeSetPasswordB', () => {
  it('dispatches a SetPasswordB effect', () => {
    const { action } = captureRequester(askAuthChallengeSetPasswordB('b'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthChallengeEffect.SetPasswordB, payload: 'b' } },
    });
  });
});
