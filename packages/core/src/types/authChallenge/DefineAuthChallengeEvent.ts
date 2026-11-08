import { UserAttributes } from '../../actions';
import { ChallengeSession } from './types';

export type DefineAuthChallengeEvent = {
  userName: string;
  session: ChallengeSession;
  userAttributes: UserAttributes;
  /**
   * true when the directory has no such user. With user existence errors suppressed the trigger still runs for an
   * unknown account, and the story must answer exactly as it would for a real one so the two cannot be told apart.
   */
  userNotFound?: boolean;
};

export type DefineAuthChallengeEventResponse = {
  runCreateAuthChallenge: boolean;
  failAuthentication: boolean;
  issueTokens: boolean;
};
