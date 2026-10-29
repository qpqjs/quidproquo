import { CognitoIdentityProviderClient, VerifySoftwareTokenCommand } from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';

// Verifies the first TOTP code during MFA_SETUP. On success Cognito returns a
// fresh session that must be passed to RespondToAuthChallenge to complete login.
// A bad code throws (e.g. CodeMismatchException / EnableSoftwareTokenMFAException).
export const verifySoftwareToken = async (region: string, session: string, userCode: string): Promise<string> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const response = await cognitoClient.send(
    new VerifySoftwareTokenCommand({
      Session: session,
      UserCode: userCode,
    }),
  );

  return response.Session || '';
};
