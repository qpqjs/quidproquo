import { createActionRequester } from '../../types';
import { UserAttributes, UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryGetUserAttributes = createActionRequester<UserAttributes>()({
  actionType: UserDirectoryActionType.GetUserAttributes,
  errorTypes: ['UserNotFound'],
  getPayload: (userDirectoryName: string, username: string) => ({ userDirectoryName, username }),
});
