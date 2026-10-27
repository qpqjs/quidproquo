import { buildTestQpqConfig, defineSecret } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { resolveSecretResourceName } from './resolveSecretResourceName';

describe('resolveSecretResourceName', () => {
  it('builds the runtime secret name from the config', () => {
    const config = buildTestQpqConfig([defineSecret('apiKey')]);

    expect(resolveSecretResourceName('apiKey', config)).toBe('apiKey-test-app-test-module-development');
  });

  it('uses the owner module override for the service segment', () => {
    const config = buildTestQpqConfig([defineSecret('apiKey', { owner: { module: 'auth' } })]);

    expect(resolveSecretResourceName('apiKey', config)).toBe('apiKey-test-app-auth-development');
  });
});
