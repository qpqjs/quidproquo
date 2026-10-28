import { buildTestQpqConfig, defineParameter } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { resolveParameterKey } from './resolveParameterKey';

describe('resolveParameterKey', () => {
  it('builds the runtime parameter key from the config', () => {
    const config = buildTestQpqConfig([defineParameter('flag')]);

    expect(resolveParameterKey('flag', config)).toBe('flag-test-app-test-module-development');
  });

  // Security regression: a parameter another module owns resolves to that module's key within this deployment, and the
  // owner's declared parameter name is what gets read, so a service can only reach parameters it was configured for.
  it("resolves a parameter owned by another module to that module's key", () => {
    const config = buildTestQpqConfig([defineParameter('flag', { owner: { module: 'auth', parameterName: 'real-flag' } })]);

    expect(resolveParameterKey('flag', config)).toBe('real-flag-test-app-auth-development');
  });
});
