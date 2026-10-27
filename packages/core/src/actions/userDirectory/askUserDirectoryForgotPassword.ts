import { createActionRequester } from '../../types';
import { AuthenticationDeliveryDetails, UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryForgotPassword = createActionRequester<AuthenticationDeliveryDetails>()({
  actionType: UserDirectoryActionType.ForgotPassword,
  errorTypes: [
    'UserNotFound', // no user matches the supplied username
    'LimitExceeded', // too many forgot-password attempts; the caller should back off and retry later
  ],
  getPayload: (userDirectoryName: string, username: string) => ({ userDirectoryName, username }),
});
