import { createActionRequester } from '../../types';
import { UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectorySetPassword = createActionRequester<void>()({
  actionType: UserDirectoryActionType.SetPassword,
  errorTypes: [
    'UserNotFound', // no user matches the supplied username
    'InvalidNewPassword', // the supplied password does not meet the user pool password policy
    'LimitExceeded', // too many attempts; the caller should back off and retry later
  ],
  getPayload: (userDirectoryName: string, username: string, newPassword: string) => ({ userDirectoryName, username, newPassword }),
});
