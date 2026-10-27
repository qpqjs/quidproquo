import { describe, expect, it } from 'vitest';

import { isQpqPackageName } from './isQpqPackageName';

describe('isQpqPackageName', () => {
  it('accepts the scoped packages and the quidproquo umbrella', () => {
    expect(isQpqPackageName('@qpqjs/core')).toBe(true);
    expect(isQpqPackageName('@qpqjs/actionprocessor-aws')).toBe(true);
    expect(isQpqPackageName('quidproquo')).toBe(true);
  });

  it('rejects other packages, including ones that only look similar', () => {
    expect(isQpqPackageName('quidproquo-core')).toBe(false);
    expect(isQpqPackageName('quidproquojs')).toBe(false);
    expect(isQpqPackageName('@qpqjsx/core')).toBe(false);
    expect(isQpqPackageName('react')).toBe(false);
  });
});
