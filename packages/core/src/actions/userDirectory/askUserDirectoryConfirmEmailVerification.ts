import { createActionRequester } from '../../types';
import { UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryConfirmEmailVerification = createActionRequester<void>()({
  actionType: UserDirectoryActionType.ConfirmEmailVerification,
  errorTypes: [
    'InvalidCode', // the supplied verification code does not match
    'ExpiredCode', // the verification code has expired; the caller should request a new one
    'LimitExceeded', // too many verification attempts; the caller should back off and retry later
  ],
  getPayload: (code: string, accessToken: string) => ({ code, accessToken }),
});
