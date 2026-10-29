import { AskResponse, askStateRead, AuthenticateUserResponse } from '@qpqjs/core';

import { askPlatformRequest, askSaveAuthToken } from '../../../platformLogic';
import { askAuthUISetAuthInfo } from '../../actionCreators/askAuthUISetAuthInfo';
import { AuthChallengeMfaSetupState } from '../types/AuthChallengeMfaSetupState';
import { AuthChallengeSendMfaSetupCodePayload } from '../types/AuthChallengeSendMfaSetupCodePayload';

// Completes MFA_SETUP. Sends the first TOTP code together with the refreshed
// session from the associate step; the server verifies the code and finishes login.
export function* askAuthChallengeSendMfaSetupCode(challenge: string, email: string): AskResponse<void> {
  const { mfaCode, session } = yield* askStateRead<AuthChallengeMfaSetupState>('');

  const response = yield* askPlatformRequest<AuthenticateUserResponse, AuthChallengeSendMfaSetupCodePayload>('POST', '/challenge', {
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
