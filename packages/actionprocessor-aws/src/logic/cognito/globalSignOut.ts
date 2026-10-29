import { CognitoIdentityProviderClient, GlobalSignOutCommand, GlobalSignOutCommandInput } from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';

// Revokes EVERY refresh token issued to the user who owns this access token. Authorized by
// the access token itself (no IAM needed, like ChangePassword). Access tokens already minted
// stay valid until they expire (stateless JWTs), so keep the access-token validity short.
export const globalSignOut = async (accessToken: string, region: string): Promise<void> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const params: GlobalSignOutCommandInput = {
    AccessToken: accessToken,
  };

  await cognitoClient.send(new GlobalSignOutCommand(params));
};
