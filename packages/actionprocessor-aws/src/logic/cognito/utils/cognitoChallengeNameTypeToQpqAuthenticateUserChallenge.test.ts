import { AuthenticateUserChallenge } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';
import { ChallengeNameType } from '@aws-sdk/client-cognito-identity-provider';

import { cognitoChallengeNameTypeToQpqAuthenticateUserChallenge } from './cognitoChallengeNameTypeToQpqAuthenticateUserChallenge';

describe('cognitoChallengeNameTypeToQpqAuthenticateUserChallenge', () => {
  it('returns NONE when no challenge is supplied', () => {
    expect(cognitoChallengeNameTypeToQpqAuthenticateUserChallenge(undefined)).toBe(AuthenticateUserChallenge.NONE);
  });

  it.each([
    [ChallengeNameType.NEW_PASSWORD_REQUIRED, AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED],
    [ChallengeNameType.CUSTOM_CHALLENGE, AuthenticateUserChallenge.CUSTOM_CHALLENGE],
    [ChallengeNameType.SOFTWARE_TOKEN_MFA, AuthenticateUserChallenge.SOFTWARE_TOKEN_MFA],
    [ChallengeNameType.MFA_SETUP, AuthenticateUserChallenge.MFA_SETUP],
  ])('maps %s to %s', (cognitoChallenge: ChallengeNameType, qpqChallenge: AuthenticateUserChallenge) => {
    expect(cognitoChallengeNameTypeToQpqAuthenticateUserChallenge(cognitoChallenge)).toBe(qpqChallenge);
  });

  it('returns a not-implemented marker for an unmapped challenge', () => {
    expect(cognitoChallengeNameTypeToQpqAuthenticateUserChallenge('SMS_MFA')).toBe('QPQ-NOT-IMP-SMS_MFA');
  });
});
