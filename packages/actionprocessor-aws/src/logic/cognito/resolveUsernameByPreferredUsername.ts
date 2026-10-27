import { CognitoIdentityProviderClient, ListUsersCommand } from '@aws-sdk/client-cognito-identity-provider';

import { createAwsClient } from '../createAwsClient';
import { buildCognitoUserFilter, InvalidCognitoFilterError } from './utils/buildCognitoUserFilter';

// A value that cannot be embedded in a Cognito filter cannot be anyone's
// preferred_username, so we skip the lookup and treat the input as an actual
// username (the same fallback as a no-match lookup).
const buildPreferredUsernameFilter = (preferredUsername: string): string | null => {
  try {
    return buildCognitoUserFilter('preferred_username', preferredUsername);
  } catch (error) {
    if (error instanceof InvalidCognitoFilterError) {
      return null;
    }
    throw error;
  }
};

/**
 * Resolves a login alias (preferred_username) to the real Cognito username.
 * Falls back to the input when nothing matches, so callers can pass either a
 * preferred username or an actual username.
 */
export const resolveUsernameByPreferredUsername = async (userPoolId: string, region: string, preferredUsername: string): Promise<string> => {
  const filter = buildPreferredUsernameFilter(preferredUsername);
  if (!filter) {
    return preferredUsername;
  }

  const cognitoClient = createAwsClient(CognitoIdentityProviderClient, {
    region,
  });

  const response = await cognitoClient.send(
    new ListUsersCommand({
      UserPoolId: userPoolId,
      Limit: 1,
      Filter: filter,
    }),
  );

  return response.Users?.[0]?.Username || preferredUsername;
};
