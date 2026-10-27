import { AskResponse, AssociateSoftwareTokenResult } from 'quidproquo-core';

import { askPlatformRequest } from '../../../../platformLogic';
import { askAuthChallengeSetMfaSetupAssociation } from '../authActionCreator';
import { AuthChallengeAssociateSoftwareTokenPayload } from '../authChallengeTypes';

// Kicks off TOTP enrollment: trades the MFA_SETUP challenge session for the
// shared secret (to show as a QR / manual key) and a refreshed session.
export function* askAuthChallengeAssociateSoftwareToken(session: string): AskResponse<void> {
  const response = yield* askPlatformRequest<AuthChallengeAssociateSoftwareTokenPayload, AssociateSoftwareTokenResult>(
    'POST',
    '/associateSoftwareToken',
    {
      body: {
        session,
      },
    },
  );

  if (response.status < 200 || response.status >= 300) {
    return;
  }

  yield* askAuthChallengeSetMfaSetupAssociation(response.data.secretCode, response.data.session);
}
