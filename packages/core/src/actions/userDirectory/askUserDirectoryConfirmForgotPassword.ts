import { createActionRequester } from '../../types';
import { AuthenticateUserResponse, UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryConfirmForgotPassword = createActionRequester<AuthenticateUserResponse>()({
  actionType: UserDirectoryActionType.ConfirmForgotPassword,
  errorTypes: [
    'InvalidCode', // the supplied confirmation code does not match
    'ExpiredCode', // the confirmation code has expired; the caller should request a new one
    'InvalidNewPassword', // the proposed new password does not meet the user pool password policy
    'LimitExceeded', // too many attempts; the caller should back off and retry later
  ],
  getPayload: (userDirectoryName: string, code: string, username: string, password: string) => ({ userDirectoryName, code, username, password }),
});
