import * as crypto from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createSecureUrlToken, getSecureUrlBaseUrl, SecureUrlToken, verifySecureUrlToken } from './secureUrlUtils';
import { FileStorageConfig } from './types';

const secret = 'top-secret';

const buildToken = (overrides: Partial<SecureUrlToken> = {}): SecureUrlToken => ({
  fullFilepath: '/storage/media/file.txt',
  operation: 'download',
  expiresAt: Date.now() + 60_000,
  ...overrides,
});

afterEach(() => {
  vi.useRealTimers();
});

describe('createSecureUrlToken', () => {
  it('returns a payload.signature token', () => {
    const token = createSecureUrlToken(buildToken(), secret);

    expect(token.split('.')).toHaveLength(2);
  });
});

describe('verifySecureUrlToken', () => {
  it('round-trips a token signed with the same secret', () => {
    const original = buildToken({ contentType: 'text/plain' });
    const token = createSecureUrlToken(original, secret);

    expect(verifySecureUrlToken(token, secret)).toEqual(original);
  });

  it('returns null when the secret does not match', () => {
    const token = createSecureUrlToken(buildToken(), secret);

    expect(verifySecureUrlToken(token, 'wrong-secret')).toBeNull();
  });

  it('returns null when the signature is tampered with', () => {
    const [payload] = createSecureUrlToken(buildToken(), secret).split('.');

    expect(verifySecureUrlToken(`${payload}.deadbeef`, secret)).toBeNull();
  });

  it('returns null when the token is missing a part', () => {
    expect(verifySecureUrlToken('onlypayload', secret)).toBeNull();
  });

  it('returns null when a correctly-signed payload is not valid json', () => {
    const garbage = Buffer.from('not-json').toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(garbage).digest('base64url');

    expect(verifySecureUrlToken(`${garbage}.${signature}`, secret)).toBeNull();
  });

  it('returns null when the token has expired', () => {
    const token = createSecureUrlToken(buildToken({ expiresAt: Date.now() - 1 }), secret);

    expect(verifySecureUrlToken(token, secret)).toBeNull();
  });
});

describe('getSecureUrlBaseUrl', () => {
  it('builds the base url from the host and the public port, not the listening port', () => {
    const config: FileStorageConfig = {
      storagePath: '/storage',
      secureUrlHost: '192.168.1.5',
      secureUrlPort: 3001,
      secureUrlPublicPort: 4000,
      secureUrlSecret: secret,
    };

    expect(getSecureUrlBaseUrl(config)).toBe('http://192.168.1.5:4000');
  });
});
