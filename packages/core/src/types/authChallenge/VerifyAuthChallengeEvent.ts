import { UserAttributes } from '../../actions';

export type VerifyAuthChallengeEvent = {
  userAttributes: UserAttributes;
  privateChallengeParameters?: Record<string, string>;
  challengeAnswer: string;
  userNotFound?: boolean;
};

/**
 * Represents the response for creating an authentication challenge.
 */
export type VerifyAuthChallengeEventResponse = {
  /**
   * true if the auth has passed verification
   */
  answerCorrect: boolean;
};
