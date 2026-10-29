import { buildMutableEffectReducer } from '@qpqjs/core';

import { AuthChallengeMfaSetupEffect, AuthChallengeMfaSetupEffects, AuthChallengeMfaSetupState } from './authChallengeTypes';

export const authChallengeMfaSetupInitialState: AuthChallengeMfaSetupState = {
  secretCode: '',
  session: '',
  mfaCode: '',
};

export const authChallengeMfaSetupReducer = buildMutableEffectReducer<AuthChallengeMfaSetupState, AuthChallengeMfaSetupEffects>({
  [AuthChallengeMfaSetupEffect.SetMfaCode]: (state, mfaCode) => {
    state.mfaCode = mfaCode;
  },
  [AuthChallengeMfaSetupEffect.SetAssociation]: (state, { secretCode, session }) => {
    state.secretCode = secretCode;
    state.session = session;
  },
});
