import { StateActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { AuthChallengeMfaEffect } from '../effects/AuthChallengeMfaEffect';
import { askAuthChallengeSetMfaCode } from './askAuthChallengeSetMfaCode';

describe('askAuthChallengeSetMfaCode', () => {
  it('dispatches a SetMfaCode effect', () => {
    const { action } = captureRequester(askAuthChallengeSetMfaCode('654321'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthChallengeMfaEffect.SetMfaCode, payload: '654321' } },
    });
  });
});
