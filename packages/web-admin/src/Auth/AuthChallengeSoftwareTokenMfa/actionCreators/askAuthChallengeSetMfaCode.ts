import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { AuthChallengeMfaEffect } from '../effects/AuthChallengeMfaEffect';
import { AuthChallengeSetMfaCodeEffect } from '../effects/AuthChallengeSetMfaCodeEffect';

export function* askAuthChallengeSetMfaCode(mfaCode: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthChallengeSetMfaCodeEffect>(AuthChallengeMfaEffect.SetMfaCode, mfaCode);
}
