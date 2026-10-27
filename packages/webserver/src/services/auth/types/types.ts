import { AuthenticateUserChallenge } from 'quidproquo-core';

export type LoginPayload = {
  username: string;
  password: string;
};

export type RefreshPayload = {
  refreshToken: string;
};

export type ChallengePayload = {
  email: string;
  session: string;
  challenge: string;
};

export type NewPasswordChallengePayload = ChallengePayload & {
  challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED;
  newPassword: string;
};

export type MfaChallengePayload = ChallengePayload & {
  challenge: AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA;
  mfaCode: string;
};

// First-time TOTP enrollment. Same wire shape as MfaChallengePayload but a
// distinct `challenge` discriminant, and `session` is the associate-step session.
export type MfaSetupChallengePayload = ChallengePayload & {
  challenge: AuthenticateUserChallenge.MFA_SETUP;
  mfaCode: string;
};

export type AnyChallengePayload = NewPasswordChallengePayload | MfaChallengePayload | MfaSetupChallengePayload;

export type AssociateSoftwareTokenPayload = {
  session: string;
};

export type ForgotPasswordPayload = {
  username: string;
};

export type ConfirmForgotPasswordPayload = {
  username: string;
  code: string;
  password: string;
};

export type ChangePasswordPayload = {
  oldPassword: string;
  newPassword: string;
};
