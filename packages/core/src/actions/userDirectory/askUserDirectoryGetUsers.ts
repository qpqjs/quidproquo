import { createActionRequester, QpqPagedData } from '../../types';
import { UserAttributes, UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryGetUsers = createActionRequester<QpqPagedData<UserAttributes>>()({
  actionType: UserDirectoryActionType.GetUsers,
  errorTypes: [
    'InvalidPageKey', // the supplied nextPageKey is malformed or no longer valid
    'LimitExceeded', // the user directory is throttling requests; the caller should back off and retry later
  ],
  getPayload: (userDirectoryName: string, nextPageKey?: string) => ({ userDirectoryName, nextPageKey }),
});
