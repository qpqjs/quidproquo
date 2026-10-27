import { AskResponse, askStateRead, AuthenticateUserResponse } from 'quidproquo-core';

import { askPlatformRequest, askSaveAuthToken } from '../../../../platformLogic';
import { askAuthUISetAuthInfo } from '../../../logic';
import { AuthChallengeMfaState, AuthChallengeSendMfaCodePayload } from '../authChallengeTypes';

export function* askAuthChallengeSendMfaCode(challenge: string, session: string, email: string): AskResponse<void> {
  const { mfaCode } = yield* askStateRead<AuthChallengeMfaState>('');

  const response = yield* askPlatformRequest<AuthChallengeSendMfaCodePayload, AuthenticateUserResponse>('POST', '/challenge', {
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
