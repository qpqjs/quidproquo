import { captureRequester, StateActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askAuthChallengeSetMfaSetupAssociation, askAuthChallengeSetMfaSetupCode } from './authActionCreator';
import { AuthChallengeMfaSetupEffect } from './authChallengeTypes';

describe('askAuthChallengeSetMfaSetupCode', () => {
  it('dispatches a SetMfaCode effect', () => {
    const { action } = captureRequester(askAuthChallengeSetMfaSetupCode('123456'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthChallengeMfaSetupEffect.SetMfaCode, payload: '123456' } },
    });
  });
});

describe('askAuthChallengeSetMfaSetupAssociation', () => {
  it('dispatches a SetAssociation effect with secret and session', () => {
    const { action } = captureRequester(askAuthChallengeSetMfaSetupAssociation('SECRET', 'SESSION'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthChallengeMfaSetupEffect.SetAssociation, payload: { secretCode: 'SECRET', session: 'SESSION' } } },
    });
  });
});
