import { AuthenticateUserChallenge } from 'quidproquo-core';

import { AnyChallengePayload, MfaChallengePayload, MfaSetupChallengePayload, NewPasswordChallengePayload } from './types';

// These payloads come straight off the wire, so a guard cannot trust the type
// it is narrowing to. Each one checks the discriminant AND that the extra
// credential field is a real non-empty string, otherwise the guard would let
// `undefined` credentials through to the user directory.

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value !== '';

export const isNewPasswordChallengePayload = (payload: AnyChallengePayload): payload is NewPasswordChallengePayload =>
  payload.challenge === AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED && isNonEmptyString((payload as NewPasswordChallengePayload).newPassword);

export const isMfaChallengePayload = (payload: AnyChallengePayload): payload is MfaChallengePayload =>
  payload.challenge === AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA && isNonEmptyString((payload as MfaChallengePayload).mfaCode);

export const isMfaSetupChallengePayload = (payload: AnyChallengePayload): payload is MfaSetupChallengePayload =>
  payload.challenge === AuthenticateUserChallenge.MFA_SETUP && isNonEmptyString((payload as MfaSetupChallengePayload).mfaCode);
