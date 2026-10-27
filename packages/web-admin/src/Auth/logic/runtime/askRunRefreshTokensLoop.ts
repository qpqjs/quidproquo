import { askDateNow, askDelay, AskResponse, askSecondsElapsedFrom, askStateRead, AuthenticateUserResponse } from 'quidproquo-core';

import { askPlatformRequest, askSaveAuthToken } from '../../../platformLogic';
import { askAuthUISetAuthInfo } from '../authActionCreator';
import { AuthRefreshTokenPayload, AuthState } from '../authTypes';

export function* askRunRefreshTokensLoop(): AskResponse<void> {
  while (true) {
    const { authenticateUserResponse } = yield* askStateRead<AuthState>('');

    if (
      authenticateUserResponse?.authenticationInfo &&
      authenticateUserResponse?.authenticationInfo.refreshToken &&
      authenticateUserResponse?.authenticationInfo.expiresAt
    ) {
      const now = yield* askDateNow();
      const timeToExpire = (yield* askSecondsElapsedFrom(now, authenticateUserResponse?.authenticationInfo.expiresAt)) * 1000;

      // Refresh the token 10 minutes before it expires to ensure there's a buffer
      const bufferTime = 10 * 60 * 1000;
      const refreshTime = timeToExpire - bufferTime;

      if (refreshTime > 0) {
        yield* askDelay(refreshTime);
      }

      const response = yield* askPlatformRequest<AuthRefreshTokenPayload, AuthenticateUserResponse>('POST', '/refreshToken', {
        body: {
          refreshToken: authenticateUserResponse.authenticationInfo?.refreshToken,
        },
      });

      if (response.status < 200 || response.status >= 300) {
        continue;
      }

      yield* askSaveAuthToken(response.data);
      yield* askAuthUISetAuthInfo(response.data);
    }

    yield* askDelay(10000);
  }
}
