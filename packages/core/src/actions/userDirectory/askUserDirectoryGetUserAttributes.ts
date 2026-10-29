import { createActionRequester } from '../../logic/actions';
import { UserAttributes, UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryGetUserAttributes = createActionRequester<UserAttributes>()({
  actionType: UserDirectoryActionType.GetUserAttributes,
  errorTypes: [
    'UserNotFound', // no user with that id in the directory
  ],
  getPayload: (userDirectoryName: string, username: string) => ({ userDirectoryName, username }),
});
