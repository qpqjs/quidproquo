import { UserAttributes } from '../../actions';
import { ChallengeSession } from './types';

export type CreateAuthChallengeEvent = {
  userName: string;
  session: ChallengeSession;
  userAttributes: UserAttributes;
  /**
   * true when the directory has no such user. With user existence errors suppressed the trigger still runs for an
   * unknown account, and the story must answer exactly as it would for a real one so the two cannot be told apart.
   */
  userNotFound?: boolean;
};

/**
 * Represents the response for creating an authentication challenge.
 */
export type CreateAuthChallengeEventResponse = {
  /**
   * The name of the custom challenge
   */
  challengeName?: string;

  /**
   * Key-value pairs for the client app to use when presenting the challenge to the user.
   * This parameter should contain all necessary information to accurately present the challenge.
   */
  publicChallengeParameters?: Record<string, string>;

  /**
   * Key-value pairs containing the information required to validate the user's response to the challenge.
   * Typically, this contains the correct answers or validation criteria for the challenge.
   */
  privateChallengeParameters?: Record<string, string>;
};
