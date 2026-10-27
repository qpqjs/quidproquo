import { captureRequester, StateActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askAuthChallengeSetMfaCode } from './authActionCreator';
import { AuthChallengeMfaEffect } from './authChallengeTypes';

describe('askAuthChallengeSetMfaCode', () => {
  it('dispatches a SetMfaCode effect', () => {
    const { action } = captureRequester(askAuthChallengeSetMfaCode('654321'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthChallengeMfaEffect.SetMfaCode, payload: '654321' } },
    });
  });
});
