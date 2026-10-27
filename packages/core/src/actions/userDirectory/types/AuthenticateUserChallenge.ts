export enum AuthenticateUserChallenge {
  NONE = 'NONE',
  NEW_PASSWORD_REQUIRED = 'NEW_PASSWORD_REQUIRED',

  // Im not sure if this is a challenge or not ~ I feel like its not
  // we will never challenge the user after an email has been sent to them... soo yeah
  RESET_PASSWORD = 'RESET_PASSWORD',

  CUSTOM_CHALLENGE = 'CUSTOM_CHALLENGE',

  // TOTP (authenticator app) code required to complete sign-in for an
  // already-enrolled user.
  SOFTWARE_TOKEN_MFA = 'SOFTWARE_TOKEN_MFA',

  // The pool requires MFA but the user has no authenticator enrolled yet. They
  // must associate a software token (TOTP), verify a code, then complete login.
  MFA_SETUP = 'MFA_SETUP',
}
