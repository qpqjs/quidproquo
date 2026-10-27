import { AuthenticationDeliveryDetails } from 'quidproquo-core';

import {
  CognitoIdentityProviderClient,
  GetUserAttributeVerificationCodeCommand,
  GetUserAttributeVerificationCodeCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';
import { cognitoCodeDeliveryDetailsToQpqDeliveryDetails } from './utils/cognitoCodeDeliveryDetailsToQpqDeliveryDetails';

export const requestEmailVerificationCode = async (region: string, accessToken: string): Promise<AuthenticationDeliveryDetails> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const params: GetUserAttributeVerificationCodeCommandInput = {
    AccessToken: accessToken,
    AttributeName: 'email',
  };

  const response = await cognitoClient.send(new GetUserAttributeVerificationCodeCommand(params));

  return cognitoCodeDeliveryDetailsToQpqDeliveryDetails(response.CodeDeliveryDetails);
};
