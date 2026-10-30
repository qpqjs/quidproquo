import { defineUserDirectory } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { createDevJwt, createDevUserId, DEV_USER_EMAIL, DevUserDirectory, resolveDevUserDirectory } from './devAuth';
import { verifyDevJwt } from './devJwt';

const SECRET = 'test-secret';
const decodeJwtPayload = (jwt: string): Record<string, any> => JSON.parse(Buffer.from(jwt!.split('.')[1]!, 'base64url').toString());

const DIRECTORY: DevUserDirectory = { serviceName: 'my-service', directoryName: 'users' };
const SIBLING_DIRECTORY: DevUserDirectory = { serviceName: 'my-service', directoryName: 'admins' };
const OTHER_SERVICE_DIRECTORY: DevUserDirectory = { serviceName: 'other-service', directoryName: 'users' };

describe('resolveDevUserDirectory', () => {
  it('resolves a directory to the current service', () => {
    const qpqConfig = buildTestQpqConfig([defineUserDirectory('users')]);

    expect(resolveDevUserDirectory('users', qpqConfig)).toEqual({ serviceName: 'test-module', directoryName: 'users' });
  });

  it('resolves a cross-module owner to the owning service and name', () => {
    const qpqConfig = buildTestQpqConfig([defineUserDirectory('users', { owner: { module: 'auth', userDirectoryName: 'members' } })]);

    expect(resolveDevUserDirectory('users', qpqConfig)).toEqual({ serviceName: 'auth', directoryName: 'members' });
  });

  it('throws for a directory that is not defined in the config', () => {
    expect(() => resolveDevUserDirectory('unknown', buildTestQpqConfig())).toThrow('UserDirectory not found: unknown');
  });
});

describe('createDevUserId', () => {
  it('returns the same userId for the same email in the same directory', () => {
    expect(createDevUserId(DIRECTORY, 'joe@example.com')).toBe(createDevUserId(DIRECTORY, 'joe@example.com'));
  });

  it('is case-insensitive and ignores surrounding whitespace', () => {
    expect(createDevUserId(DIRECTORY, 'Joe@Example.com')).toBe(createDevUserId(DIRECTORY, 'joe@example.com'));
    expect(createDevUserId(DIRECTORY, ' joe@example.com ')).toBe(createDevUserId(DIRECTORY, 'joe@example.com'));
  });

  it('returns different userIds for different emails', () => {
    expect(createDevUserId(DIRECTORY, 'joe@example.com')).not.toBe(createDevUserId(DIRECTORY, 'jane@example.com'));
  });

  it('returns different userIds for the same email in two directories, like Cognito pools', () => {
    expect(createDevUserId(DIRECTORY, 'joe@example.com')).not.toBe(createDevUserId(SIBLING_DIRECTORY, 'joe@example.com'));
  });

  it('returns different userIds for same-named directories on different services', () => {
    expect(createDevUserId(DIRECTORY, 'joe@example.com')).not.toBe(createDevUserId(OTHER_SERVICE_DIRECTORY, 'joe@example.com'));
  });

  it('returns a v5 UUID', () => {
    expect(createDevUserId(DIRECTORY, 'joe@example.com')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('falls back to the dev user for a missing username', () => {
    expect(createDevUserId(DIRECTORY)).toBe(createDevUserId(DIRECTORY, DEV_USER_EMAIL));
  });
});

describe('createDevJwt', () => {
  it('puts the derived userId in sub and keeps the email in username/email', () => {
    const payload = decodeJwtPayload(createDevJwt(SECRET, DIRECTORY, 'joe@example.com'));

    expect(payload.sub).toBe(createDevUserId(DIRECTORY, 'joe@example.com'));
    expect(payload.username).toBe('joe@example.com');
    expect(payload.email).toBe('joe@example.com');
  });

  it('mints the same sub for the same login across tokens', () => {
    expect(decodeJwtPayload(createDevJwt(SECRET, DIRECTORY, 'joe@example.com')).sub).toBe(
      decodeJwtPayload(createDevJwt(SECRET, DIRECTORY, 'Joe@Example.com')).sub,
    );
  });

  // Security regression: a dev token must never verify against a real pool, and nothing but this
  // directory's secret must verify it here. HS256 over a per-checkout secret: an RS256 verifier
  // rejects the algorithm outright, and a token signed with another secret is refused locally.
  it('signs with the directory secret, never alg none, and refuses another secret', () => {
    const jwt = createDevJwt(SECRET, DIRECTORY, 'joe@example.com');
    const [header, , signature] = jwt.split('.');

    expect(JSON.parse(Buffer.from(header!, 'base64url')!.toString())).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(signature).not.toBe('dev-signature');
    expect(verifyDevJwt(SECRET, jwt)).toMatchObject({ email: 'joe@example.com' });
    expect(verifyDevJwt('another-secret', jwt)).toBeNull();
    expect(decodeJwtPayload(jwt).iss).toBeUndefined();
  });

  it('mints different subs for the same login in different directories', () => {
    expect(decodeJwtPayload(createDevJwt(SECRET, DIRECTORY, 'joe@example.com')).sub).not.toBe(
      decodeJwtPayload(createDevJwt(SECRET, SIBLING_DIRECTORY, 'joe@example.com')).sub,
    );
  });
});
