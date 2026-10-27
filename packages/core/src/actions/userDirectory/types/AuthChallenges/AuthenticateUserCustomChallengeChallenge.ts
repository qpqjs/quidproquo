import { AuthenticateUserChallenge } from '../AuthenticateUserChallenge';
import { AuthChallengeBase } from './AuthChallengeBase';

export interface AuthenticateUserCustomChallengeChallenge<T> extends AuthChallengeBase {
  challenge: AuthenticateUserChallenge.CUSTOM_CHALLENGE;

  challengeAnswer: T;
}
