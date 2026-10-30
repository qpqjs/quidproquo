import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import { AuthChallengeMfaSetupEffect } from '../effects/AuthChallengeMfaSetupEffect';
import { AuthChallengeMfaSetupSetAssociationEffect } from '../effects/AuthChallengeMfaSetupSetAssociationEffect';

export function* askAuthChallengeSetMfaSetupAssociation(secretCode: string, session: string): AskResponse<void> {
  yield* askStateDispatchEffect<AuthChallengeMfaSetupSetAssociationEffect>(AuthChallengeMfaSetupEffect.SetAssociation, {
    secretCode,
    session,
  });
}
