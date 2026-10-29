import { AskResponse, askStateRead, AuthenticateUserResponse } from '@qpqjs/core';

import { askPlatformRequest, askSaveAuthToken } from '../../../platformLogic';
import { askAuthSetAuthInfo } from '../../actionCreators/askAuthSetAuthInfo';
import { AuthChallengeMfaState } from '../types/AuthChallengeMfaState';
import { AuthChallengeSendMfaCodePayload } from '../types/AuthChallengeSendMfaCodePayload';

export function* askAuthChallengeSendMfaCode(challenge: string, session: string, email: string): AskResponse<void> {
  const { mfaCode } = yield* askStateRead<AuthChallengeMfaState>('');

  const response = yield* askPlatformRequest<AuthenticateUserResponse, AuthChallengeSendMfaCodePayload>('POST', '/challenge', {
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
  yield* askAuthSetAuthInfo(response.data);
}
