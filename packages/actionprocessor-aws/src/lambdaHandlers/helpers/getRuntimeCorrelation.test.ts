import { buildTestQpqConfig } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getRuntimeCorrelation } from './getRuntimeCorrelation';

describe('getRuntimeCorrelation', () => {
  it('prefixes a guid with the module name', () => {
    expect(getRuntimeCorrelation(buildTestQpqConfig())).toMatch(/^test-module::[0-9a-f-]{36}$/);
  });

  it('produces a unique correlation per call', () => {
    const config = buildTestQpqConfig();

    expect(getRuntimeCorrelation(config)).not.toBe(getRuntimeCorrelation(config));
  });
});
