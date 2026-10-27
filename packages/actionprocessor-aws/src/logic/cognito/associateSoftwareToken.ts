import { AssociateSoftwareTokenResult } from 'quidproquo-core';

import { AssociateSoftwareTokenCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';

// Begins TOTP enrollment for the MFA_SETUP challenge. Cognito returns the
// shared secret to seed the authenticator app and a refreshed session that must
// be used for the subsequent VerifySoftwareToken / RespondToAuthChallenge calls.
export const associateSoftwareToken = async (region: string, session: string): Promise<AssociateSoftwareTokenResult> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const response = await cognitoClient.send(new AssociateSoftwareTokenCommand({ Session: session }));

  return {
    secretCode: response.SecretCode || '',
    session: response.Session || '',
  };
};
