import { createActionRequester } from '../../types';
import { UserDirectoryActionType } from './UserDirectoryActionType';

export interface AssociateSoftwareTokenResult {
  // Base32 secret used to seed the authenticator app (and to build the
  // otpauth:// URI / QR code shown to the user).
  secretCode: string;

  // Refreshed Cognito session to carry into the verify/respond step.
  session: string;
}

export const askUserDirectoryAssociateSoftwareToken = createActionRequester<AssociateSoftwareTokenResult>()({
  actionType: UserDirectoryActionType.AssociateSoftwareToken,
  getPayload: (userDirectoryName: string, session: string) => ({ userDirectoryName, session }),
});
