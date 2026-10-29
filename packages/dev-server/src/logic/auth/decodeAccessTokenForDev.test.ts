import { describe, expect, it } from 'vitest';

import { decodeAccessTokenForDev } from './decodeAccessTokenForDev';
import { signDevJwt } from './devJwt';

const SECRET = 'test-secret';
const now = () => Math.floor(Date.now() / 1000);

describe('decodeAccessTokenForDev', () => {
  it('returns null when no access token is supplied', () => {
    expect(decodeAccessTokenForDev(SECRET, 'dir')).toBeNull();
  });

  it('returns null for a token that is not a JWT', () => {
    expect(decodeAccessTokenForDev(SECRET, 'dir', 'not-a-token')).toBeNull();
  });

  it('extracts user info and marks a current token as valid', () => {
    const exp = now() + 3600;

    expect(decodeAccessTokenForDev(SECRET, 'dir', signDevJwt(SECRET, { sub: 'user-1', username: 'joe', exp }))).toEqual({
      userId: 'user-1',
      username: 'joe',
      exp,
      wasValid: true,
      userDirectory: 'dir',
    });
  });

  it('marks an expired token as not valid, unless expiry is ignored', () => {
    const token = signDevJwt(SECRET, { sub: 'user-1', username: 'joe', exp: now() - 10 });

    expect(decodeAccessTokenForDev(SECRET, 'dir', token)).toMatchObject({ wasValid: false });
    expect(decodeAccessTokenForDev(SECRET, 'dir', token, true)).toMatchObject({ wasValid: true });
  });

  // Security regression: the claims are only believed when the signature is this directory's.
  it('refuses a token signed with another secret, a tampered payload and an unsigned token', () => {
    const exp = now() + 3600;
    const token = signDevJwt(SECRET, { sub: 'user-1', username: 'joe', exp });
    const [header, , signature] = token.split('.');
    const tampered = `${header}.${Buffer.from(JSON.stringify({ sub: 'admin', username: 'admin', exp })).toString('base64url')}.${signature}`;
    const unsigned = `${Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')}.${token.split('.')[1]}.dev-signature`;

    expect(decodeAccessTokenForDev('another-secret', 'dir', token)).toBeNull();
    expect(decodeAccessTokenForDev(SECRET, 'dir', tampered)).toBeNull();
    expect(decodeAccessTokenForDev(SECRET, 'dir', unsigned)).toBeNull();
  });
});
