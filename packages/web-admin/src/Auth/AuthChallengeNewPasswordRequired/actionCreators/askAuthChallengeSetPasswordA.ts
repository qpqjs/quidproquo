import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { AuthChallengeEffect } from '../effects/AuthChallengeEffect';
import { AuthChallengeSetPasswordAEffect } from '../effects/AuthChallengeSetPasswordAEffect';

export function* askAuthChallengeSetPasswordA(password: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthChallengeSetPasswordAEffect>(AuthChallengeEffect.SetPasswordA, password);
}
