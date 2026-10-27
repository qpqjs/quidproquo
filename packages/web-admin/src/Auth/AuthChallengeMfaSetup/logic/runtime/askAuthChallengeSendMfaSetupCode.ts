import { AskResponse, askStateRead, AuthenticateUserResponse } from 'quidproquo-core';

import { askPlatformRequest, askSaveAuthToken } from '../../../../platformLogic';
import { askAuthUISetAuthInfo } from '../../../logic';
import { AuthChallengeMfaSetupState, AuthChallengeSendMfaSetupCodePayload } from '../authChallengeTypes';

// Completes MFA_SETUP. Sends the first TOTP code together with the refreshed
// session from the associate step; the server verifies the code and finishes login.
export function* askAuthChallengeSendMfaSetupCode(challenge: string, email: string): AskResponse<void> {
  const { mfaCode, session } = yield* askStateRead<AuthChallengeMfaSetupState>('');

  const response = yield* askPlatformRequest<AuthChallengeSendMfaSetupCodePayload, AuthenticateUserResponse>('POST', '/challenge', {
    body: {
      challenge,
      email,
      mfaCode,
      session,
    },
  });

  if (response.status < 200 || response.status >= 300) {
    return;
  }

  yield* askSaveAuthToken(response.data);
  yield* askAuthUISetAuthInfo(response.data);
}
