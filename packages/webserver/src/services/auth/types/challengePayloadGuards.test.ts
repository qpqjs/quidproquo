import { AuthenticateUserChallenge } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { isMfaChallengePayload, isMfaSetupChallengePayload, isNewPasswordChallengePayload } from './challengePayloadGuards';
import { AnyChallengePayload } from './types';

const payloadFor = (challenge: AuthenticateUserChallenge, extra: Record<string, unknown> = {}): AnyChallengePayload =>
  ({ email: 'a@b.com', session: 's', challenge, ...extra }) as AnyChallengePayload;

describe('challengePayloadGuards', () => {
  it.each([
    [AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED, isNewPasswordChallengePayload, { newPassword: 'pw' }],
    [AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA, isMfaChallengePayload, { mfaCode: '123' }],
    [AuthenticateUserChallenge.MFA_SETUP, isMfaSetupChallengePayload, { mfaCode: '123' }],
  ])(
    'matches %s with its own guard',
    (challenge: AuthenticateUserChallenge, guard: (payload: AnyChallengePayload) => boolean, extra: Record<string, unknown>) => {
      expect(guard(payloadFor(challenge, extra))).toBe(true);
    },
  );

  it.each([
    [AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA, isNewPasswordChallengePayload, { mfaCode: '123' }],
    [AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED, isMfaChallengePayload, { newPassword: 'pw' }],
    [AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA, isMfaSetupChallengePayload, { mfaCode: '123' }],
  ])(
    'rejects %s with a different guard',
    (challenge: AuthenticateUserChallenge, guard: (payload: AnyChallengePayload) => boolean, extra: Record<string, unknown>) => {
      expect(guard(payloadFor(challenge, extra))).toBe(false);
    },
  );

  // Wire payloads are untrusted, so a matching discriminant alone must not pass
  // the guard when the credential field is missing, empty, or the wrong type.
  it.each([
    [AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED, isNewPasswordChallengePayload, {}],
    [AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED, isNewPasswordChallengePayload, { newPassword: '' }],
    [AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED, isNewPasswordChallengePayload, { newPassword: 42 }],
    [AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA, isMfaChallengePayload, {}],
    [AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA, isMfaChallengePayload, { mfaCode: '' }],
    [AuthenticateUserChallenge.MFA_SETUP, isMfaSetupChallengePayload, {}],
    [AuthenticateUserChallenge.MFA_SETUP, isMfaSetupChallengePayload, { mfaCode: '' }],
  ])(
    'rejects %s when the credential field is missing or invalid (case %#)',
    (challenge: AuthenticateUserChallenge, guard: (payload: AnyChallengePayload) => boolean, extra: Record<string, unknown>) => {
      expect(guard(payloadFor(challenge, extra))).toBe(false);
    },
  );
});
