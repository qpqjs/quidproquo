import { buildTestQpqConfig, DecodedAccessToken, ErrorTypeEnum, UserDirectoryActionType } from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { decodeAccessToken } from '../../../logic/cognito/decodeAccessToken';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getUserDirectoryReadAccessTokenActionProcessor } from './getUserDirectoryReadAccessTokenActionProcessor';

vi.mock('../../../logic/cognito/decodeAccessToken', () => ({
  decodeAccessToken: vi.fn(),
}));

const farFuture = 4102444800; // 2100-01-01
const decodedToken: DecodedAccessToken = {
  userId: 'user-1',
  username: 'joe@example.com',
  exp: farFuture,
  wasValid: true,
  userDirectory: 'users',
};

const resolveProcessor = async () => {
  const processors = await getUserDirectoryReadAccessTokenActionProcessor(buildTestQpqConfig([]), {} as any);
  return processors[UserDirectoryActionType.ReadAccessToken];
};

describe('getUserDirectoryReadAccessTokenActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(decodeAccessToken).mockReset();
  });

  it('returns the session token when one is already decoded, without re-decoding', async () => {
    const processor = await resolveProcessor();

    const result = await invokeProcessor(
      processor,
      { userDirectoryName: 'users', ignoreExpiration: false },
      { session: { decodedAccessToken: decodedToken } },
    );

    expect(result).toEqual([decodedToken]);
    expect(decodeAccessToken).not.toHaveBeenCalled();
  });

  it('returns Unauthorized for an unverified session token, even when it has not expired', async () => {
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(
      processor,
      { userDirectoryName: 'users', ignoreExpiration: false },
      { session: { decodedAccessToken: { ...decodedToken, wasValid: false } } },
    );

    expect(error?.errorType).toBe(ErrorTypeEnum.Unauthorized);
    expect(decodeAccessToken).not.toHaveBeenCalled();
  });

  it('returns Unauthorized for an unverified session token with no exp claim, even when expiry is ignored', async () => {
    const processor = await resolveProcessor();
    const [, error] = await invokeProcessor(
      processor,
      { userDirectoryName: 'users', ignoreExpiration: true },
      { session: { decodedAccessToken: { ...decodedToken, wasValid: false, exp: 0 } } },
    );
    expect(error?.errorType).toBe(ErrorTypeEnum.Unauthorized);
    expect(decodeAccessToken).not.toHaveBeenCalled();
  });

  it('returns Invalid when the session token has expired and expiry matters', async () => {
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(
      processor,
      { userDirectoryName: 'users', ignoreExpiration: false },
      { session: { decodedAccessToken: { ...decodedToken, exp: 1 } } },
    );

    expect(error?.errorType).toBe(ErrorTypeEnum.Invalid);
  });

  it('returns an expired session token when ignoreExpiration is set', async () => {
    const processor = await resolveProcessor();
    const expiredToken = { ...decodedToken, exp: 1 };

    const result = await invokeProcessor(
      processor,
      { userDirectoryName: 'users', ignoreExpiration: true },
      { session: { decodedAccessToken: expiredToken } },
    );

    expect(result).toEqual([expiredToken]);
  });

  it('decodes the raw session accessToken when no decoded token is on the session', async () => {
    vi.mocked(decodeAccessToken).mockResolvedValue(decodedToken);
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { userDirectoryName: 'users', ignoreExpiration: false }, { session: { accessToken: 'tok' } });

    expect(result).toEqual([decodedToken]);
  });

  it('returns Unauthorized when the raw token cannot be decoded', async () => {
    // decodeAccessToken THROWS on an invalid token (InvalidAccessTokenError);
    // that must surface as a typed Unauthorized result, not a raw throw that
    // degrades to GenericError.
    vi.mocked(decodeAccessToken).mockRejectedValue(new Error('Unable to decode access token'));
    const processor = await resolveProcessor();

    const [, error] = await invokeProcessor(
      processor,
      { userDirectoryName: 'users', ignoreExpiration: false },
      { session: { accessToken: 'forged' } },
    );

    expect(error?.errorType).toBe(ErrorTypeEnum.Unauthorized);
  });
});
