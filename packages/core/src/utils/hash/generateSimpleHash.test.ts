import { describe, expect, it } from 'vitest';

import { generateSimpleHash } from './generateSimpleHash';

describe('generateSimpleHash', () => {
  it('returns an 8-character hex string', () => {
    const hash = generateSimpleHash('hello');

    expect(hash).toHaveLength(8);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it('is deterministic for the same input', () => {
    expect(generateSimpleHash('hello')).toBe(generateSimpleHash('hello'));
  });

  it('produces different hashes for different inputs', () => {
    expect(generateSimpleHash('hello')).not.toBe(generateSimpleHash('world'));
  });

  it('joins the rest arguments into the hashed string', () => {
    expect(generateSimpleHash('a', 'b', 'c')).toBe(generateSimpleHash('abc'));
  });

  it('pads small hash values with leading zeros to 8 characters', () => {
    // 'a' hashes to charCode 97 = 0x61, so padding must fill the rest.
    expect(generateSimpleHash('a')).toBe('00000061');
  });

  it('hashes the empty string to eight zeros', () => {
    expect(generateSimpleHash('')).toBe('00000000');
  });
});
