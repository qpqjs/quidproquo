import { createActionRequester } from '../../types';
import { UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryRevokeRefreshToken = createActionRequester<void>()({
  actionType: UserDirectoryActionType.RevokeRefreshToken,
  errorTypes: [
    'Unauthorized', // the refresh token is invalid/already revoked, or revocation is disabled on the app client
    'LimitExceeded', // too many attempts; the caller should back off and retry later
  ],
  getPayload: (userDirectoryName: string, refreshToken: string) => ({ userDirectoryName, refreshToken }),
});
