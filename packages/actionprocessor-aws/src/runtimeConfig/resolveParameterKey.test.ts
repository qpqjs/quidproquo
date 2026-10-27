import { buildTestQpqConfig, defineParameter } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { resolveParameterKey } from './resolveParameterKey';

describe('resolveParameterKey', () => {
  it('builds the runtime parameter key from the config', () => {
    const config = buildTestQpqConfig([defineParameter('flag')]);

    expect(resolveParameterKey('flag', config)).toBe('flag-test-app-test-module-development');
  });
});
