import { AuthenticateUserChallenge } from '../AuthenticateUserChallenge';
import { AuthChallengeBase } from './AuthChallengeBase';

export type AuthenticateUserSoftwareTokenMfaChallenge = {
  challenge: AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA;

  mfaCode: string;
} & AuthChallengeBase;
