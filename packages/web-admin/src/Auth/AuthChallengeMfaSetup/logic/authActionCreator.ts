import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { AuthChallengeMfaSetupEffect, AuthChallengeMfaSetupSetAssociationEffect, AuthChallengeMfaSetupSetMfaCodeEffect } from './authChallengeTypes';

export function* askAuthChallengeSetMfaSetupCode(mfaCode: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthChallengeMfaSetupSetMfaCodeEffect>(AuthChallengeMfaSetupEffect.SetMfaCode, mfaCode);
}

export function* askAuthChallengeSetMfaSetupAssociation(secretCode: string, session: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthChallengeMfaSetupSetAssociationEffect>(AuthChallengeMfaSetupEffect.SetAssociation, {
    secretCode,
    session,
  });
}
