import {
  CognitoIdentityProviderClient,
  VerifyUserAttributeCommand,
  VerifyUserAttributeCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';

/** Confirms the email attribute with the verification code sent to the user. */
export const verifyUserEmail = async (region: string, accessToken: string, verificationCode: string): Promise<void> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const params: VerifyUserAttributeCommandInput = {
    AccessToken: accessToken,
    AttributeName: 'email',
    Code: verificationCode,
  };

  await cognitoClient.send(new VerifyUserAttributeCommand(params));
};
