import { describe, expect, it } from 'vitest';

import { authChallengeMfaInitialState, authChallengeMfaReducer } from './authChallengeReducer';
import { AuthChallengeMfaEffect } from './authChallengeTypes';

describe('authChallengeMfaReducer', () => {
  it('sets the mfa code', () => {
    const [state, handled] = authChallengeMfaReducer(authChallengeMfaInitialState, { type: AuthChallengeMfaEffect.SetMfaCode, payload: '654321' });

    expect(state.mfaCode).toBe('654321');
    expect(handled).toBe(true);
  });

  it('does not handle an unknown effect', () => {
    const [, handled] = authChallengeMfaReducer(authChallengeMfaInitialState, { type: 'unknown', payload: undefined } as never);

    expect(handled).toBe(false);
  });
});
