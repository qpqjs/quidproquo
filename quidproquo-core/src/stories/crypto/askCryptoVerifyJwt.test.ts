import { describe, expect, it } from 'vitest';

import { CryptoActionType, DateActionType } from '../../actions';
import { runStory } from '../../testing';
import { base64UrlEncodeUtf8 } from '../../utils';
import { askCryptoVerifyJwt } from './askCryptoVerifyJwt';

const HEADER = base64UrlEncodeUtf8(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
const NOW_ISO = '2026-09-11T00:00:00.000Z';
const NOW_SECONDS = Math.floor(Date.parse(NOW_ISO) / 1000);

const tokenFor = (claims: object, header: string = HEADER, signature: string = 'c2ln') =>
  `${header}.${base64UrlEncodeUtf8(JSON.stringify(claims))}.${signature}`;

const run = (token: string, signatureIsValid: boolean = true) => {
  const verifyCalls: unknown[] = [];

  const result = runStory(askCryptoVerifyJwt<{ sub: string }>('my-signing-key', token), {
    [CryptoActionType.Verify]: (action: any) => {
      verifyCalls.push(action.payload);
      return signatureIsValid;
    },
    [DateActionType.Now]: NOW_ISO,
  });

  return { result, verifyCalls };
};

describe('askCryptoVerifyJwt', () => {
  it('returns the claims for a valid, unexpired token and verifies header.payload with the key', () => {
    const token = tokenFor({ sub: 'client-1', exp: NOW_SECONDS + 60 });
    const { result, verifyCalls } = run(token);

    expect(result).toEqual({ valid: true, claims: { sub: 'client-1', exp: NOW_SECONDS + 60 } });
    expect(verifyCalls).toEqual([{ keyName: 'my-signing-key', message: token.split('.').slice(0, 2).join('.'), signature: 'c2ln' }]);
  });

  it('accepts a token with no time claims without reading the clock', () => {
    const result = runStory(askCryptoVerifyJwt('my-signing-key', tokenFor({ sub: 'client-1' })), {
      [CryptoActionType.Verify]: true,
    });

    expect(result).toEqual({ valid: true, claims: { sub: 'client-1' } });
  });

  it.each([
    ['two segments', 'a.b'],
    ['four segments', 'a.b.c.d'],
    ['non base64url segment', `${HEADER}.pay+load.c2ln`],
    ['header not json', `${base64UrlEncodeUtf8('nope')}.${base64UrlEncodeUtf8('{}')}.c2ln`],
    ['header json but not an object', `${base64UrlEncodeUtf8('[1]')}.${base64UrlEncodeUtf8('{}')}.c2ln`],
  ])('rejects a %s token as malformed before touching the key', (_label, token) => {
    const { result, verifyCalls } = run(token);

    expect(result).toEqual({ valid: false, reason: 'malformed' });
    expect(verifyCalls).toEqual([]);
  });

  it('rejects a payload that is not a json object as malformed, after the signature checks out', () => {
    const { result, verifyCalls } = run(`${HEADER}.${base64UrlEncodeUtf8('"just a string"')}.c2ln`);

    expect(result).toEqual({ valid: false, reason: 'malformed' });
    expect(verifyCalls).toHaveLength(1);
  });

  it('rejects any algorithm other than RS256 without verifying', () => {
    const { result, verifyCalls } = run(tokenFor({ sub: 'x' }, base64UrlEncodeUtf8(JSON.stringify({ alg: 'none', typ: 'JWT' }))));

    expect(result).toEqual({ valid: false, reason: 'unsupported-algorithm' });
    expect(verifyCalls).toEqual([]);
  });

  it('rejects a bad signature without reading the payload', () => {
    const { result } = run(tokenFor({ sub: 'x', exp: NOW_SECONDS + 60 }), false);

    expect(result).toEqual({ valid: false, reason: 'bad-signature' });
  });

  it('rejects an expired token (exp is exclusive)', () => {
    expect(run(tokenFor({ exp: NOW_SECONDS })).result).toEqual({ valid: false, reason: 'expired' });
    expect(run(tokenFor({ exp: NOW_SECONDS - 1 })).result).toEqual({ valid: false, reason: 'expired' });
    expect(run(tokenFor({ exp: NOW_SECONDS + 1 })).result.valid).toBe(true);
  });

  it('rejects a token before nbf (nbf is inclusive)', () => {
    expect(run(tokenFor({ nbf: NOW_SECONDS + 1 })).result).toEqual({ valid: false, reason: 'not-yet-valid' });
    expect(run(tokenFor({ nbf: NOW_SECONDS })).result.valid).toBe(true);
  });
});
