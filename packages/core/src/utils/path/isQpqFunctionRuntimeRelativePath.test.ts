import { describe, expect, it } from 'vitest';

import { isQpqFunctionRuntimeRelativePath } from './isQpqFunctionRuntimeRelativePath';

describe('isQpqFunctionRuntimeRelativePath', () => {
  it('returns true for a relative path string runtime', () => {
    expect(isQpqFunctionRuntimeRelativePath('/entry/controller::onAuth')).toBe(true);
  });

  it('returns false for an advanced object runtime', () => {
    expect(isQpqFunctionRuntimeRelativePath({ basePath: '/base', relativePath: 'rel', functionName: 'fn' })).toBe(false);
  });
});
