import { AuthenticateUserChallenge } from '../AuthenticateUserChallenge';
import { AuthChallengeBase } from './AuthChallengeBase';

export interface AuthenticateUserNewPasswordRequiredChallenge extends AuthChallengeBase {
  challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED;

  newPassword: string;
}
