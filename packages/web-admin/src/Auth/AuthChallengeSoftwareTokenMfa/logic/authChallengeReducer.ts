import { buildMutableEffectReducer } from 'quidproquo-core';

import { AuthChallengeMfaEffect, AuthChallengeMfaEffects, AuthChallengeMfaState } from './authChallengeTypes';

export const authChallengeMfaInitalState: AuthChallengeMfaState = {
  mfaCode: '',
};

export const authChallengeMfaReducer = buildMutableEffectReducer<AuthChallengeMfaState, AuthChallengeMfaEffects>({
  [AuthChallengeMfaEffect.SetMfaCode]: (state, mfaCode) => {
    state.mfaCode = mfaCode;
  },
});
