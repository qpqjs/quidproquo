import { AuthenticateUserChallenge } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';
import { ChallengeNameType } from '@aws-sdk/client-cognito-identity-provider';

import { cognitoAdminInitiateAuthResponseToQpqAuthenticationInfo } from './cognitoAdminInitiateAuthResponseToQpqAuthenticationInfo';

describe('cognitoAdminInitiateAuthResponseToQpqAuthenticationInfo', () => {
  it('passes through the session, challenge and challenge parameters', () => {
    const res = cognitoAdminInitiateAuthResponseToQpqAuthenticationInfo(
      { Session: 'sess', ChallengeName: ChallengeNameType.NEW_PASSWORD_REQUIRED, ChallengeParameters: { USERNAME: 'a' } },
      '2026-01-01T00:00:00.000Z',
    );

    expect(res).toEqual({
      session: 'sess',
      challenge: AuthenticateUserChallenge.NEW_PASSWORD_REQUIRED,
      challengeParameters: { USERNAME: 'a' },
    });
  });

  it('includes authenticationInfo when an AuthenticationResult is present', () => {
    const res = cognitoAdminInitiateAuthResponseToQpqAuthenticationInfo(
      { AuthenticationResult: { AccessToken: 'access', ExpiresIn: 60 } },
      '2026-01-01T00:00:00.000Z',
    );

    expect(res.challenge).toBe(AuthenticateUserChallenge.NONE);
    expect(res.authenticationInfo?.accessToken).toBe('access');
    expect(res.authenticationInfo?.expiresAt).toBe('2026-01-01T00:01:00.000Z');
  });
});
