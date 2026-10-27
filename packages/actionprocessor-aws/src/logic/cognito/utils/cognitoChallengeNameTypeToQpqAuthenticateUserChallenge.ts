import { AuthenticateUserChallenge } from 'quidproquo-core';

import { ChallengeNameType } from '@aws-sdk/client-cognito-identity-provider';

const challengeMap: Record<string, AuthenticateUserChallenge> = {
  [ChallengeNameType.NEW_PASSWORD_REQUIRED]: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
  [ChallengeNameType.CUSTOM_CHALLENGE]: AuthenticateUserChallenge.CUSTOM_CHALLENGE,
  [ChallengeNameType.SOFTWARE_TOKEN_MFA]: AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA,
  [ChallengeNameType.MFA_SETUP]: AuthenticateUserChallenge.MFA_SETUP,
};

/**
 * Maps a Cognito challenge name onto the qpq AuthenticateUserChallenge enum.
 * Challenges qpq does not implement yet (e.g. SMS_MFA) come back as a
 * `QPQ-NOT-IMP-<name>` marker so the gap is visible and searchable at the caller
 * instead of being silently treated as NONE.
 */
export const cognitoChallengeNameTypeToQpqAuthenticateUserChallenge = (
  cognitoChallengeName: ChallengeNameType | string | undefined,
): AuthenticateUserChallenge => {
  if (!cognitoChallengeName) {
    return AuthenticateUserChallenge.NONE;
  }

  // The marker is not a real enum member; the cast keeps the return type honest
  // for implemented challenges while letting the marker flow through.
  return challengeMap[cognitoChallengeName] || (`QPQ-NOT-IMP-${cognitoChallengeName}` as AuthenticateUserChallenge);
};
