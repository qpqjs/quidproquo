import { describe, expect, it } from 'vitest';

import { isDefined } from './isDefined';

describe('isDefined', () => {
  it('returns true for defined values including falsy ones', () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined('')).toBe(true);
    expect(isDefined(false)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isDefined(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isDefined(undefined)).toBe(false);
  });
});
