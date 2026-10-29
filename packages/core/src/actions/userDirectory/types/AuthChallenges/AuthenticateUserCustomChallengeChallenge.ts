import { AuthenticateUserChallenge } from '../AuthenticateUserChallenge';
import { AuthChallengeBase } from './AuthChallengeBase';

export type AuthenticateUserCustomChallengeChallenge<T> = {
  challenge: AuthenticateUserChallenge.CUSTOM_CHALLENGE;

  challengeAnswer: T;
} & AuthChallengeBase;
