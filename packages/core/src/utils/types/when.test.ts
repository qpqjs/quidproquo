import { describe, expect, it } from 'vitest';

import { when } from './when';

describe('when', () => {
  it('returns the value when the condition is truthy', () => {
    expect(when(true, 'yes')).toBe('yes');
  });

  it('returns undefined by default when the condition is falsy', () => {
    expect(when(false, 'yes')).toBeUndefined();
  });

  it('returns the fallback when the condition is falsy', () => {
    expect(when(0, 'yes', 'no')).toBe('no');
  });
});
