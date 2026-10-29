import { describe, expect, it } from 'vitest';

import { authChallengeInitialState, authChallengeReducer } from './authChallengeReducer';
import { AuthChallengeEffect } from './authChallengeTypes';

describe('authChallengeReducer', () => {
  it('sets passwordA', () => {
    const [state] = authChallengeReducer(authChallengeInitialState, { type: AuthChallengeEffect.SetPasswordA, payload: 'a' });

    expect(state.passwordA).toBe('a');
  });

  it('sets passwordB', () => {
    const [state] = authChallengeReducer(authChallengeInitialState, { type: AuthChallengeEffect.SetPasswordB, payload: 'b' });

    expect(state.passwordB).toBe('b');
  });

  it('does not handle an unknown effect', () => {
    const [state, handled] = authChallengeReducer(authChallengeInitialState, { type: 'auth/Unknown', payload: 'x' } as never);

    expect(state).toBe(authChallengeInitialState);
    expect(handled).toBe(false);
  });
});
