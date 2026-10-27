import { describe, expect, it } from 'vitest';

import { getGlobalsFromQpqFunctionRuntime } from './getGlobalsFromQpqFunctionRuntime';

describe('getGlobalsFromQpqFunctionRuntime', () => {
  it('returns the globals of an advanced runtime', () => {
    const globals = { featureFlag: true };

    expect(getGlobalsFromQpqFunctionRuntime({ basePath: '/base', relativePath: 'rel', functionName: 'fn', globals })).toBe(globals);
  });

  it('returns undefined for an advanced runtime without globals', () => {
    expect(getGlobalsFromQpqFunctionRuntime({ basePath: '/base', relativePath: 'rel', functionName: 'fn' })).toBeUndefined();
  });

  it('returns undefined for a relative path string runtime and for no runtime', () => {
    expect(getGlobalsFromQpqFunctionRuntime('/entry/controller::onAuth')).toBeUndefined();
    expect(getGlobalsFromQpqFunctionRuntime(undefined)).toBeUndefined();
  });
});
