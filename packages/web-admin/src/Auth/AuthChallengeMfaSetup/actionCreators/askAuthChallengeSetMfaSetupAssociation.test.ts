import { StateActionType } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { AuthChallengeMfaSetupEffect } from '../effects/AuthChallengeMfaSetupEffect';
import { askAuthChallengeSetMfaSetupAssociation } from './askAuthChallengeSetMfaSetupAssociation';

describe('askAuthChallengeSetMfaSetupAssociation', () => {
  it('dispatches a SetAssociation effect with secret and session', () => {
    const { action } = captureRequester(askAuthChallengeSetMfaSetupAssociation('SECRET', 'SESSION'));

    expect(action).toEqual({
      type: StateActionType.Dispatch,
      payload: { action: { type: AuthChallengeMfaSetupEffect.SetAssociation, payload: { secretCode: 'SECRET', session: 'SESSION' } } },
    });
  });
});
