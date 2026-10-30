import { buildTestQpqConfig } from '@qpqjs/testing';

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

  // Security regression: a correlation is the config module name plus a v4 guid and nothing else, so no request field
  // can ever shape one and ids are unguessable.
  it('is the module name, one separator and a v4 guid', () => {
    const correlation = getRuntimeCorrelation(buildTestQpqConfig());
    const [module, guid, ...rest] = correlation.split('::');

    expect(module).toBe('test-module');
    expect(rest).toEqual([]);
    expect(guid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
