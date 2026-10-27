import { createActionRequester, QpqPagedData } from '../../types';
import { UserAttributes, UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryGetUsersByAttribute = createActionRequester<QpqPagedData<UserAttributes>>()({
  actionType: UserDirectoryActionType.GetUsersByAttribute,
  errorTypes: [
    'InvalidSearchParameters', // the attribute name/value, limit, or page key is invalid or the attribute is not searchable
    'LimitExceeded', // the user directory is throttling requests; the caller should back off and retry later
  ],
  getPayload: (userDirectoryName: string, attribueName: keyof UserAttributes, attribueValue: string, limit?: number, nextPageKey?: string) => ({
    userDirectoryName,
    attribueName,
    attribueValue,
    limit,
    nextPageKey,
  }),
});
