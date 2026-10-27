import { createActionRequester } from '../../types';
import { AuthenticateUserResponse, UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryRefreshToken = createActionRequester<AuthenticateUserResponse>()({
  actionType: UserDirectoryActionType.RefreshToken,
  errorTypes: [
    'Unauthorized', // the access token is missing/invalid, or the refresh token was rejected (expired/revoked); the caller must re-authenticate
    'LimitExceeded', // too many refresh attempts; the caller should back off and retry later
  ],
  getPayload: (userDirectoryName: string, refreshToken: string) => ({ userDirectoryName, refreshToken }),
});
