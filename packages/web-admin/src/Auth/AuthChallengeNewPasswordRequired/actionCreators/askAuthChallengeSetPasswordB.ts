import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { AuthChallengeEffect } from '../effects/AuthChallengeEffect';
import { AuthChallengeSetPasswordBEffect } from '../effects/AuthChallengeSetPasswordBEffect';

export function* askAuthChallengeSetPasswordB(password: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthChallengeSetPasswordBEffect>(AuthChallengeEffect.SetPasswordB, password);
}
