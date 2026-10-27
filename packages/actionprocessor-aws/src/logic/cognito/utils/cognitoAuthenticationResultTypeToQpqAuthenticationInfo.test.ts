import { describe, expect, it } from 'vitest';

import { cognitoAuthenticationResultTypeToQpqAuthenticationInfo } from './cognitoAuthenticationResultTypeToQpqAuthenticationInfo';

describe('cognitoAuthenticationResultTypeToQpqAuthenticationInfo', () => {
  it('maps token fields and computes expiresAt from the issue time plus ExpiresIn', () => {
    const info = cognitoAuthenticationResultTypeToQpqAuthenticationInfo(
      { AccessToken: 'access', IdToken: 'id', RefreshToken: 'refresh', TokenType: 'Bearer', ExpiresIn: 3600 },
      '2026-01-01T00:00:00.000Z',
    );

    expect(info).toEqual({
      accessToken: 'access',
      idToken: 'id',
      refreshToken: 'refresh',
      tokenType: 'Bearer',
      expirationDurationInSeconds: 3600,
      expiresAt: '2026-01-01T01:00:00.000Z',
    });
  });

  it('treats a missing ExpiresIn as a zero-second offset', () => {
    const info = cognitoAuthenticationResultTypeToQpqAuthenticationInfo({ AccessToken: 'access' }, '2026-01-01T00:00:00.000Z');

    expect(info.expiresAt).toBe('2026-01-01T00:00:00.000Z');
  });
});
