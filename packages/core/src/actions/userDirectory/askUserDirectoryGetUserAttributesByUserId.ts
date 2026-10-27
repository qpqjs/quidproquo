import { createActionRequester } from '../../types';
import { UserAttributes, UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryGetUserAttributesByUserId = createActionRequester<UserAttributes>()({
  actionType: UserDirectoryActionType.GetUserAttributesByUserId,
  errorTypes: [
    'UserNotFound', // no user matches the supplied userId (sub)
  ],
  getPayload: (userDirectoryName: string, userId: string) => ({ userDirectoryName, userId }),
});
