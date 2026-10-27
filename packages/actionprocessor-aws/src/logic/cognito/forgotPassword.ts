import { AuthenticationDeliveryDetails } from 'quidproquo-core';

import { CognitoIdentityProviderClient, ForgotPasswordCommand, ForgotPasswordCommandInput } from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';
import { calculateSecretHash } from './utils/calculateSecretHash';
import { cognitoCodeDeliveryDetailsToQpqDeliveryDetails } from './utils/cognitoCodeDeliveryDetailsToQpqDeliveryDetails';
import { getUserPoolClientSecret } from './getUserPoolClientSecret';

export const forgotPassword = async (
  userPoolId: string,
  clientId: string,
  region: string,
  username: string,
): Promise<AuthenticationDeliveryDetails> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const clientSecret = await getUserPoolClientSecret(userPoolId, clientId, region);
  const secretHash = calculateSecretHash(username, clientId, clientSecret);

  const params: ForgotPasswordCommandInput = {
    ClientId: clientId,
    Username: username,
    SecretHash: secretHash,
    ClientMetadata: {
      userInitiated: 'true',
    },
  };

  const response = await cognitoClient.send(new ForgotPasswordCommand(params));

  return cognitoCodeDeliveryDetailsToQpqDeliveryDetails(response.CodeDeliveryDetails);
};
