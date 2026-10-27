import { createActionRequester } from '../../types';
import { UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryChangePassword = createActionRequester<void>()({
  actionType: UserDirectoryActionType.ChangePassword,
  errorTypes: [
    'IncorrectPassword', // the supplied current password was wrong (or the access token was invalid)
    'InvalidNewPassword', // the proposed new password does not meet the user pool password policy
    'LimitExceeded', // too many password-change attempts; the caller should back off and retry later
  ],
  getPayload: (oldPassword: string, newPassword: string, accessToken: string) => ({ oldPassword, newPassword, accessToken }),
});
