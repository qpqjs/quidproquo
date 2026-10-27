import { createActionRequester } from '../../types';
import { UserAttributes, UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectorySetUserAttributes = createActionRequester<void>()({
  actionType: UserDirectoryActionType.SetUserAttributes,
  errorTypes: [
    'UserNotFound', // no user matches the supplied username
    'InvalidAttributes', // one or more supplied attribute names/values are invalid
    'AliasExists', // an email/phone attribute value is already in use by another account
    'LimitExceeded', // too many attempts; the caller should back off and retry later
  ],
  getPayload: (userDirectoryName: string, username: string, userAttributes: UserAttributes) => ({ userDirectoryName, username, userAttributes }),
});
