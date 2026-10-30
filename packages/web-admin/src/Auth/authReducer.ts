import { buildEffectReducer } from '@qpqjs/core';

import { AuthEffect } from './effects/AuthEffect';
import { AuthEffects } from './effects/AuthEffects';
import { setAuthInfo } from './stateUpdaters/setAuthInfo';
import { setPassword } from './stateUpdaters/setPassword';
import { setUsername } from './stateUpdaters/setUsername';
import { AuthState } from './types/AuthState';

export const authReducer = buildEffectReducer<AuthState, AuthEffects>({
  [AuthEffect.SetUsername]: setUsername,
  [AuthEffect.SetPassword]: setPassword,
  [AuthEffect.SetAuthInfo]: setAuthInfo,
});
