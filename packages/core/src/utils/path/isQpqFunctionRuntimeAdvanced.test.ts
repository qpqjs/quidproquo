import { describe, expect, it } from 'vitest';

import { isQpqFunctionRuntimeAdvanced } from './isQpqFunctionRuntimeAdvanced';

describe('isQpqFunctionRuntimeAdvanced', () => {
  it('returns true for an advanced object runtime', () => {
    expect(isQpqFunctionRuntimeAdvanced({ basePath: '/base', relativePath: 'rel', functionName: 'fn' })).toBe(true);
  });

  it('returns false for a relative path string runtime', () => {
    expect(isQpqFunctionRuntimeAdvanced('/entry/controller::onAuth')).toBe(false);
  });
});
