import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { AuthChallengeMfaEffect, AuthChallengeSetMfaCodeEffect } from './authChallengeTypes';

export function* askAuthChallengeSetMfaCode(mfaCode: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthChallengeSetMfaCodeEffect>(AuthChallengeMfaEffect.SetMfaCode, mfaCode);
}
