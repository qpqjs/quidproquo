import { AuthenticateUserChallenge } from '../AuthenticateUserChallenge';

export interface AuthChallengeBase {
  challenge: AuthenticateUserChallenge;
  username: string;

  session: string;
}
