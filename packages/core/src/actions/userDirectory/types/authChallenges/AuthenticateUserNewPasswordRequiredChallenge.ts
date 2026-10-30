import { AuthenticateUserChallenge } from '../AuthenticateUserChallenge';
import { AuthChallengeBase } from './AuthChallengeBase';

export type AuthenticateUserNewPasswordRequiredChallenge = {
  challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED;

  newPassword: string;
} & AuthChallengeBase;
