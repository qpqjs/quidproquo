import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { AuthChallengeMfaSetupEffect } from '../effects/AuthChallengeMfaSetupEffect';
import { AuthChallengeMfaSetupSetMfaCodeEffect } from '../effects/AuthChallengeMfaSetupSetMfaCodeEffect';

export function* askAuthChallengeSetMfaSetupCode(mfaCode: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthChallengeMfaSetupSetMfaCodeEffect>(AuthChallengeMfaSetupEffect.SetMfaCode, mfaCode);
}
