import { buildEffectReducer } from '@qpqjs/core';

import { AuthChallengeMfaEffect } from './effects/AuthChallengeMfaEffect';
import { AuthChallengeMfaEffects } from './effects/AuthChallengeMfaEffects';
import { setMfaCode } from './stateUpdaters/setMfaCode';
import { AuthChallengeMfaState } from './types/AuthChallengeMfaState';

export const authChallengeMfaReducer = buildEffectReducer<AuthChallengeMfaState, AuthChallengeMfaEffects>({
  [AuthChallengeMfaEffect.SetMfaCode]: setMfaCode,
});
