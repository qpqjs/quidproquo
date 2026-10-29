import { buildMutableEffectReducer } from '@qpqjs/core';

import { AuthChallengeMfaEffect, AuthChallengeMfaEffects, AuthChallengeMfaState } from './authChallengeTypes';

export const authChallengeMfaInitialState: AuthChallengeMfaState = {
  mfaCode: '',
};

export const authChallengeMfaReducer = buildMutableEffectReducer<AuthChallengeMfaState, AuthChallengeMfaEffects>({
  [AuthChallengeMfaEffect.SetMfaCode]: (state, mfaCode) => {
    state.mfaCode = mfaCode;
  },
});
