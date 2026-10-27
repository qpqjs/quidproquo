import { createActionRequester } from '../../types';
import { UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectorySignOutUser = createActionRequester<void>()({
  actionType: UserDirectoryActionType.SignOutUser,
  errorTypes: [
    'Unauthorized', // the access token is missing/invalid/expired — there is nothing to revoke
    'LimitExceeded', // too many attempts; the caller should back off and retry later
  ],
  getPayload: (accessToken: string) => ({ accessToken }),
});
