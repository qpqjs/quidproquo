import { AuthenticateUserChallenge } from '../AuthenticateUserChallenge';
import { AuthChallengeBase } from './AuthChallengeBase';

export interface AuthenticateUserMfaSetupChallenge extends AuthChallengeBase {
  challenge: AuthenticateUserChallenge.MFA_SETUP;

  // First TOTP code from the freshly-associated authenticator. The processor
  // verifies it (VerifySoftwareToken) before completing the MFA_SETUP challenge.
  mfaCode: string;
}
