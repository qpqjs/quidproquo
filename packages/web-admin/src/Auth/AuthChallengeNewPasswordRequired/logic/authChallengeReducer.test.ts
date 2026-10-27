import { describe, expect, it } from 'vitest';

import { authChallengeInitalState, authChallengeReducer } from './authChallengeReducer';
import { AuthChallengeEffect } from './authChallengeTypes';

describe('authChallengeReducer', () => {
  it('sets passwordA', () => {
    const [state] = authChallengeReducer(authChallengeInitalState, { type: AuthChallengeEffect.SetPasswordA, payload: 'a' });

    expect(state.passwordA).toBe('a');
  });

  it('sets passwordB', () => {
    const [state] = authChallengeReducer(authChallengeInitalState, { type: AuthChallengeEffect.SetPasswordB, payload: 'b' });

    expect(state.passwordB).toBe('b');
  });

  it('does not handle an unknown effect', () => {
    const [state, handled] = authChallengeReducer(authChallengeInitalState, { type: 'auth/Unknown', payload: 'x' } as never);

    expect(state).toBe(authChallengeInitalState);
    expect(handled).toBe(false);
  });
});
