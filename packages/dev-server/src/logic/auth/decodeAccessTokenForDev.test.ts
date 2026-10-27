import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { decodeAccessTokenForDev } from './decodeAccessTokenForDev';

const { unsafeDecodeJWTPayload } = vi.hoisted(() => ({ unsafeDecodeJWTPayload: vi.fn() }));

vi.mock('quidproquo-webserver', () => ({
  qpqWebServerUtils: { unsafeDecodeJWTPayload },
}));

describe('decodeAccessTokenForDev', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when no access token is supplied', () => {
    expect(decodeAccessTokenForDev('dir')).toBeNull();
    expect(unsafeDecodeJWTPayload).not.toHaveBeenCalled();
  });

  it('returns null when the payload cannot be decoded', () => {
    unsafeDecodeJWTPayload.mockReturnValue(null);
    expect(decodeAccessTokenForDev('dir', 'token')).toBeNull();
  });

  it('extracts user info and marks a current token as valid', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    unsafeDecodeJWTPayload.mockReturnValue({ sub: 'user-1', username: 'joe', exp });

    expect(decodeAccessTokenForDev('dir', 'token')).toEqual({
      userId: 'user-1',
      username: 'joe',
      exp,
      wasValid: true,
      userDirectory: 'dir',
    });
  });

  it('marks an expired token as not valid', () => {
    const exp = Math.floor(Date.now() / 1000) - 10;
    unsafeDecodeJWTPayload.mockReturnValue({ sub: 'user-1', username: 'joe', exp });

    expect(decodeAccessTokenForDev('dir', 'token')).toMatchObject({ wasValid: false });
  });

  it('keeps an expired token valid when ignoreExpiration is true', () => {
    const exp = Math.floor(Date.now() / 1000) - 10;
    unsafeDecodeJWTPayload.mockReturnValue({ sub: 'user-1', username: 'joe', exp });

    expect(decodeAccessTokenForDev('dir', 'token', true)).toMatchObject({ wasValid: true });
  });

  it('returns null when the decoder throws', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    unsafeDecodeJWTPayload.mockImplementation(() => {
      throw new Error('boom');
    });

    expect(decodeAccessTokenForDev('dir', 'token')).toBeNull();
  });
});
