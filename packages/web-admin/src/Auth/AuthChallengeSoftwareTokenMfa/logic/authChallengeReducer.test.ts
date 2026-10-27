import { describe, expect, it } from 'vitest';

import { authChallengeMfaInitalState, authChallengeMfaReducer } from './authChallengeReducer';
import { AuthChallengeMfaEffect } from './authChallengeTypes';

describe('authChallengeMfaReducer', () => {
  it('sets the mfa code', () => {
    const [state, handled] = authChallengeMfaReducer(authChallengeMfaInitalState, { type: AuthChallengeMfaEffect.SetMfaCode, payload: '654321' });

    expect(state.mfaCode).toBe('654321');
    expect(handled).toBe(true);
  });

  it('does not handle an unknown effect', () => {
    const [, handled] = authChallengeMfaReducer(authChallengeMfaInitalState, { type: 'unknown', payload: undefined } as never);

    expect(handled).toBe(false);
  });
});
