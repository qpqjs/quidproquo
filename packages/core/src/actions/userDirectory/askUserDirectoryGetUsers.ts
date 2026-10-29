import { createActionRequester } from '../../logic/actions';
import { QpqPagedData } from '../../types';
import { UserAttributes } from './types';
import { UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryGetUsers = createActionRequester<QpqPagedData<UserAttributes>>()({
  actionType: UserDirectoryActionType.GetUsers,
  errorTypes: [
    'InvalidPageKey', // the supplied nextPageKey is malformed or expired
    'LimitExceeded', // the user directory is throttling requests; the caller should back off and retry later
  ],
  getPayload: (userDirectoryName: string, nextPageKey?: string) => ({ userDirectoryName, nextPageKey }),
});
