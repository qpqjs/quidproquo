import { AskResponse, askStateRead, AuthenticateUserResponse } from '@qpqjs/core';

import { askPlatformRequest, askSaveAuthToken } from '../../../platformLogic';
import { askAuthSetAuthInfo } from '../../actionCreators/askAuthSetAuthInfo';
import { AuthChallengeSetPasswordPayload } from '../types/AuthChallengeSetPasswordPayload';
import { AuthChallengeState } from '../types/AuthChallengeState';

export function* askAuthChallengeSendPasswords(challenge: string, session: string, email: string): AskResponse<void> {
  const { passwordA } = yield* askStateRead<AuthChallengeState>('');

  const response = yield* askPlatformRequest<AuthenticateUserResponse, AuthChallengeSetPasswordPayload>('POST', '/challenge', {
    body: {
      challenge,
      email,
      newPassword: passwordA,
      session,
    },
  });

  if (response.status < 200 || response.status >= 300) {
    return;
  }

  yield* askSaveAuthToken(response.data);
  yield* askAuthSetAuthInfo(response.data);
}
