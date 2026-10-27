import { generateKeyPairSync } from 'crypto';
import { sign } from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';

import { decodeValidJwt } from './decodeValidJwt';

const poolKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const otherKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });

const poolPrivatePem = poolKeys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const otherPrivatePem = otherKeys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

// The mocked JWKS always serves the pool's public key, standing in for the
// Cognito-hosted jwks.json. Closures read poolKeys lazily, after module init.
vi.mock('jwks-rsa', () => ({
  default: () => ({
    getSigningKey: async () => ({
      getPublicKey: () => poolKeys.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    }),
  }),
}));

const userPoolId = 'us-east-1_TestPool';
const region = 'us-east-1';
const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;

const nowInSeconds = () => Math.floor(Date.now() / 1000);

const validAccessTokenClaims = () => ({
  sub: 'user-sub-1',
  iss: issuer,
  token_use: 'access',
  username: 'alice',
  exp: nowInSeconds() + 3600,
});

const signToken = (claims: Record<string, unknown>, privatePem: string = poolPrivatePem): string =>
  sign(claims, privatePem, { algorithm: 'RS256', keyid: 'test-key' });

describe('decodeValidJwt', () => {
  it('returns null when no access token is provided', async () => {
    expect(await decodeValidJwt(userPoolId, region, false)).toBeNull();
  });

  it('returns null when the token cannot be decoded', async () => {
    expect(await decodeValidJwt(userPoolId, region, false, 'not-a-jwt')).toBeNull();
  });

  it('decodes a valid access token', async () => {
    const claims = validAccessTokenClaims();

    expect(await decodeValidJwt(userPoolId, region, false, signToken(claims))).toEqual({
      userId: 'user-sub-1',
      username: 'alice',
      exp: claims.exp,
      wasValid: true,
    });
  });

  it('returns null for an expired token', async () => {
    const token = signToken({ ...validAccessTokenClaims(), exp: nowInSeconds() - 60 });

    expect(await decodeValidJwt(userPoolId, region, false, token)).toBeNull();
  });

  it('decodes an expired token when ignoreExpiration is set', async () => {
    const exp = nowInSeconds() - 60;
    const token = signToken({ ...validAccessTokenClaims(), exp });

    expect(await decodeValidJwt(userPoolId, region, true, token)).toMatchObject({ username: 'alice', exp });
  });

  it('returns null for a token signed with a key the pool does not own', async () => {
    const token = signToken(validAccessTokenClaims(), otherPrivatePem);

    expect(await decodeValidJwt(userPoolId, region, false, token)).toBeNull();
  });

  it('returns null for an HS256 token signed with the public key as its secret', async () => {
    // Classic algorithm-confusion attack: only RS256 may verify.
    const publicPem = poolKeys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
    const token = sign(validAccessTokenClaims(), publicPem, { algorithm: 'HS256', keyid: 'test-key' });

    expect(await decodeValidJwt(userPoolId, region, false, token)).toBeNull();
  });

  it('returns null for an id token (token_use is not access)', async () => {
    // An id token from the same pool passes signature verification, so token_use must be checked.
    const token = signToken({ ...validAccessTokenClaims(), token_use: 'id' });

    expect(await decodeValidJwt(userPoolId, region, false, token)).toBeNull();
  });

  it('returns null for a token issued by a different issuer', async () => {
    const token = signToken({ ...validAccessTokenClaims(), iss: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_OtherPool' });

    expect(await decodeValidJwt(userPoolId, region, false, token)).toBeNull();
  });
});
