export type AuthChallengeMfaSetupState = {
  // Base32 secret returned by AssociateSoftwareToken (seeds the authenticator).
  secretCode: string;
  // Refreshed session from AssociateSoftwareToken, used to complete the challenge.
  session: string;
  mfaCode: string;
};
