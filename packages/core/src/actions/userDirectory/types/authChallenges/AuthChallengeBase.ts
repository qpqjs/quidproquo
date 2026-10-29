import { AuthenticateUserChallenge } from '../AuthenticateUserChallenge';

export type AuthChallengeBase = {
  challenge: AuthenticateUserChallenge;
  username: string;

  session: string;
};
