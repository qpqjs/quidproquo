import { AuthenticateUserResponse, CreateUserRequest } from 'quidproquo-core';

import {
  AdminCreateUserCommand,
  AdminCreateUserCommandInput,
  CognitoIdentityProviderClient,
  DeliveryMediumType,
  MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';
import { authenticateUser } from './authenticateUser';
import { getCognitoUserAttributesFromQpqUserAttributes } from './getCognitoUserAttributesFromQpqUserAttributes';
import { setUserPassword } from './setUserPassword';

/**
 * Creates a Cognito user with the requested attributes, activates their password
 * and signs them in, returning the authenticated session.
 */
export const createUser = async (
  userPoolId: string,
  region: string,
  clientId: string,
  createUserRequest: CreateUserRequest,
): Promise<AuthenticateUserResponse> => {
  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const params: AdminCreateUserCommandInput = {
    UserPoolId: userPoolId,
    Username: createUserRequest.email,
    MessageAction: MessageActionType.SUPPRESS, // Don't contact the user
    DesiredDeliveryMediums: [DeliveryMediumType.EMAIL],
    // createUserRequest includes password; it has no cognitoAttributeMap entry,
    // so the mapper drops it rather than writing it as a user attribute.
    UserAttributes: getCognitoUserAttributesFromQpqUserAttributes(createUserRequest),
    ForceAliasCreation: false,
  };

  if (createUserRequest.phoneNumber) {
    params.DesiredDeliveryMediums!.push(DeliveryMediumType.SMS);
  }

  const response = await cognitoClient.send(new AdminCreateUserCommand(params));

  const username = response.User?.Username || '';

  await setUserPassword(region, userPoolId, username, createUserRequest.password);

  return authenticateUser(userPoolId, clientId, region, false, username, createUserRequest.password);
};
