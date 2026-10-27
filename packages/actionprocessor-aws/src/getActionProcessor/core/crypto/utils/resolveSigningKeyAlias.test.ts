import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, defineSigningKey } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { resolveSigningKeyAlias } from './resolveSigningKeyAlias';

describe('resolveSigningKeyAlias', () => {
  it('derives the alias for an owned key from the service naming', () => {
    const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1'), defineSigningKey('my-key')]);

    expect(resolveSigningKeyAlias('my-key', qpqConfig)).toBe('alias/my-key-test-app-test-module-development');
  });

  it('derives the alias under the owning module for a cross-module key', () => {
    const qpqConfig = buildTestQpqConfig([
      defineAwsServiceAccountInfo('111', 'eu-west-1'),
      defineSigningKey('my-key', { owner: { module: 'auth', signingKeyName: 'access-token-key' } }),
    ]);

    expect(resolveSigningKeyAlias('my-key', qpqConfig)).toBe('alias/access-token-key-test-app-auth-development');
  });

  it('returns null for a key that is not configured', () => {
    expect(resolveSigningKeyAlias('unknown', buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]))).toBeNull();
  });
});
