import { describe, expect, it } from 'vitest';

import { isString } from './isString';

describe('isString', () => {
  it('returns true for a string', () => {
    expect(isString('hello')).toBe(true);
  });

  it('returns true for an empty string', () => {
    expect(isString('')).toBe(true);
  });

  it('returns false for non-string values', () => {
    expect(isString(42)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString({})).toBe(false);
  });

  // Security regression: only primitive strings pass; a boxed String or a string-like object never does.
  it('returns false for boxed strings and string-like objects', () => {
    expect(isString(new String('x'))).toBe(false);
    expect(isString({ toString: () => 'x', length: 1 })).toBe(false);
  });
});
