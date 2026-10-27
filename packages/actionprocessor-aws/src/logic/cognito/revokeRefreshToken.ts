import { CognitoIdentityProviderClient, RevokeTokenCommand, RevokeTokenCommandInput } from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';
import { getUserPoolClientSecret } from './getUserPoolClientSecret';

// Revokes a single refresh token (and its access-token lineage) via Cognito RevokeToken.
// The app client has a secret (same one the refresh flow uses), so it must be supplied.
// Requires token revocation to be enabled on the app client (the CDK default) — a disabled
// client surfaces as UnsupportedOperationException/UnsupportedTokenTypeException.
export const revokeRefreshToken = async (userPoolId: string, clientId: string, region: string, refreshToken: string): Promise<void> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const clientSecret = await getUserPoolClientSecret(userPoolId, clientId, region);

  const params: RevokeTokenCommandInput = {
    Token: refreshToken,
    ClientId: clientId,
    ClientSecret: clientSecret,
  };

  await cognitoClient.send(new RevokeTokenCommand(params));
};
