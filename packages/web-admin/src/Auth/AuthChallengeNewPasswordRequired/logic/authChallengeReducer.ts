import { buildMutableEffectReducer } from 'quidproquo-core';

import { AuthChallengeEffect, AuthChallengeEffects, AuthChallengeState } from './authChallengeTypes';

export const authChallengeInitalState: AuthChallengeState = {
  passwordA: '',
  passwordB: '',
};

export const authChallengeReducer = buildMutableEffectReducer<AuthChallengeState, AuthChallengeEffects>({
  [AuthChallengeEffect.SetPasswordA]: (state, password) => {
    state.passwordA = password;
  },

  [AuthChallengeEffect.SetPasswordB]: (state, password) => {
    state.passwordB = password;
  },
});
