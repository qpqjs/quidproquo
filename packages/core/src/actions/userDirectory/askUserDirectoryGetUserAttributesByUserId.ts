import { createActionRequester } from '../../logic/actions';
import { UserAttributes } from './types';
import { UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryGetUserAttributesByUserId = createActionRequester<UserAttributes>()({
  actionType: UserDirectoryActionType.GetUserAttributesByUserId,
  errorTypes: [
    'UserNotFound', // no user matches the supplied userId (sub)
  ],
  getPayload: (userDirectoryName: string, userId: string) => ({ userDirectoryName, userId }),
});
