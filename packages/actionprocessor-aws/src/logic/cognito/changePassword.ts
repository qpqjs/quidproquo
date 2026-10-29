import { ChangePasswordCommand, ChangePasswordCommandInput, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';

export const changePassword = async (accessToken: string, previousPassword: string, proposedPassword: string, region: string): Promise<void> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const params: ChangePasswordCommandInput = {
    AccessToken: accessToken,
    PreviousPassword: previousPassword,
    ProposedPassword: proposedPassword,
  };

  await cognitoClient.send(new ChangePasswordCommand(params));
};
