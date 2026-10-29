import { buildEffectReducer } from '@qpqjs/core';

import { AuthChallengeEffect } from './effects/AuthChallengeEffect';
import { AuthChallengeEffects } from './effects/AuthChallengeEffects';
import { setPasswordA } from './stateUpdaters/setPasswordA';
import { setPasswordB } from './stateUpdaters/setPasswordB';
import { AuthChallengeState } from './types/AuthChallengeState';

export const authChallengeReducer = buildEffectReducer<AuthChallengeState, AuthChallengeEffects>({
  [AuthChallengeEffect.SetPasswordA]: setPasswordA,
  [AuthChallengeEffect.SetPasswordB]: setPasswordB,
});
