import { StateActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { AuthChallengeMfaSetupEffect } from '../effects/AuthChallengeMfaSetupEffect';
import { askAuthChallengeSetMfaSetupCode } from './askAuthChallengeSetMfaSetupCode';

describe('askAuthChallengeSetMfaSetupCode', () => {
  it('dispatches a SetMfaCode effect', () => {
    const { action } = captureRequester(askAuthChallengeSetMfaSetupCode('123456'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthChallengeMfaSetupEffect.SetMfaCode, payload: '123456' } },
    });
  });
});
