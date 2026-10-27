import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { AuthChallengeMfaEffect, AuthChallengeSetMfaCodeEffect } from './authChallengeTypes';

export function* askAuthChallengeSetMfaCode(mfaCode: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthChallengeSetMfaCodeEffect>(AuthChallengeMfaEffect.SetMfaCode, mfaCode);
}
