import {
  AdminSetUserPasswordCommand,
  AdminSetUserPasswordCommandInput,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';

export const setUserPassword = async (region: string, userPoolId: string, username: string, password: string): Promise<void> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const passwordParams: AdminSetUserPasswordCommandInput = {
    Password: password,
    Username: username,
    UserPoolId: userPoolId,
    // Activate the password immediately rather than leaving the user in the
    // FORCE_CHANGE_PASSWORD state a temporary password would.
    Permanent: true,
  };

  await cognitoClient.send(new AdminSetUserPasswordCommand(passwordParams));
};
