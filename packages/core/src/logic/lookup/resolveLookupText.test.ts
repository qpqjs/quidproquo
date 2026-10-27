import { describe, expect, it } from 'vitest';

import { resolveLookupText } from './resolveLookupText';

enum Color {
  Red = 'red',
  Green = 'green',
}

describe('resolveLookupText', () => {
  it('returns the enum key whose value matches', () => {
    expect(resolveLookupText(Color.Green, Color)).toBe('Green');
  });

  it('returns an empty string when no value matches', () => {
    expect(resolveLookupText('blue' as Color, Color)).toBe('');
  });

  it('resolves the key for a numeric value', () => {
    const map = { One: 1, Two: 2 };

    expect(resolveLookupText(2, map)).toBe('Two');
  });
});
