import { describe, expect, it } from 'vitest';

import { ErrorTypeEnum } from '../../types';
import { isErroredActionResult } from './isErroredActionResult';

describe('isErroredActionResult', () => {
  it('is false for a successful result', () => {
    expect(isErroredActionResult(['value'])).toBe(false);
  });

  it('is true when an error is present', () => {
    expect(isErroredActionResult([undefined, { errorType: ErrorTypeEnum.GenericError, errorText: 'x' }])).toBe(true);
  });

  it('is true for a missing result tuple', () => {
    expect(isErroredActionResult(undefined as any)).toBe(true);
  });
});
