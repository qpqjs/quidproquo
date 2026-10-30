import { buildEffectReducer } from '@qpqjs/core';

import { AuthChallengeMfaSetupEffect } from './effects/AuthChallengeMfaSetupEffect';
import { AuthChallengeMfaSetupEffects } from './effects/AuthChallengeMfaSetupEffects';
import { setAssociation } from './stateUpdaters/setAssociation';
import { setMfaCode } from './stateUpdaters/setMfaCode';
import { AuthChallengeMfaSetupState } from './types/AuthChallengeMfaSetupState';

export const authChallengeMfaSetupReducer = buildEffectReducer<AuthChallengeMfaSetupState, AuthChallengeMfaSetupEffects>({
  [AuthChallengeMfaSetupEffect.SetMfaCode]: setMfaCode,
  [AuthChallengeMfaSetupEffect.SetAssociation]: setAssociation,
});
