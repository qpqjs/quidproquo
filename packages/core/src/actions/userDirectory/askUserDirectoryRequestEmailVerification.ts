import { createActionRequester } from '../../types';
import { AuthenticationDeliveryDetails, UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryRequestEmailVerification = createActionRequester<AuthenticationDeliveryDetails>()({
  actionType: UserDirectoryActionType.RequestEmailVerification,
  errorTypes: [
    'Unauthorized', // the access token is missing/invalid; the caller must re-authenticate
    'LimitExceeded', // too many verification-code requests; the caller should back off and retry later
    'CodeDeliveryFailed', // the verification code could not be delivered to the user
  ],
  getPayload: (userDirectoryName: string, accessToken: string) => ({ userDirectoryName, accessToken }),
});
