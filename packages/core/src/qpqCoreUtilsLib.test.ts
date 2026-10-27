import { describe, expect, it } from 'vitest';

import { qpqCoreUtils } from './qpqCoreUtilsLib';

describe('qpqCoreUtils', () => {
  it('aggregates the core config selectors', () => {
    expect(typeof qpqCoreUtils.flattenQpqConfig).toBe('function');
    expect(typeof qpqCoreUtils.getApplicationName).toBe('function');
  });

  it('merges in the additional config utils', () => {
    expect(typeof qpqCoreUtils.convertCrossModuleOwnerToGenericResourceNameOverride).toBe('function');
  });
});
