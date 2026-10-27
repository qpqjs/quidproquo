import { AuthenticateUserChallenge } from '../AuthenticateUserChallenge';
import { AuthChallengeBase } from './AuthChallengeBase';

export interface AuthenticateUserSoftwareTokenMfaChallenge extends AuthChallengeBase {
  challenge: AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA;

  mfaCode: string;
}
