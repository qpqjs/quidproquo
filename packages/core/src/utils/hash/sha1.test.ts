import { describe, expect, it } from 'vitest';

import { sha1 } from './sha1';

const sha1Hex = (input: string): string => Array.from(sha1(new TextEncoder().encode(input)), (b) => b.toString(16).padStart(2, '0')).join('');

describe('sha1', () => {
  // Known-answer vectors from RFC 3174 / FIPS 180.
  it('hashes the empty message', () => {
    expect(sha1Hex('')).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
  });

  it('hashes "abc"', () => {
    expect(sha1Hex('abc')).toBe('a9993e364706816aba3e25717850c26c9cd0d89d');
  });

  it('hashes a message whose padding spills into a second block', () => {
    expect(sha1Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe('84983e441c3bd26ebaae4aa1f95129e5e54670f1');
  });

  it('hashes a multi-block message', () => {
    expect(sha1Hex('a'.repeat(1000))).toBe('291e9a6c66994949b57ba5e650361e98fc36b1ba');
  });

  // Padding boundary vectors (computed with node:crypto): 55 bytes is the largest
  // single-block message, 56-64 force the length words into a second block.
  it('hashes the padding boundary lengths correctly', () => {
    expect(sha1Hex('a'.repeat(55))).toBe('c1c8bbdc22796e28c0e15163d20899b65621d65a');
    expect(sha1Hex('a'.repeat(56))).toBe('c2db330f6083854c99d4b5bfb6e8f29f201be699');
    expect(sha1Hex('a'.repeat(63))).toBe('03f09f5b158a7a8cdad920bddc29b81c18a551f5');
    expect(sha1Hex('a'.repeat(64))).toBe('0098ba824b5c16427bd7a1122a5a442a25ec644d');
    expect(sha1Hex('a'.repeat(65))).toBe('11655326c708d70319be2610e8a57d9a5b959d3b');
  });

  it('returns a 20-byte digest', () => {
    expect(sha1(new Uint8Array(0))).toHaveLength(20);
  });

  it('is deterministic for the same input', () => {
    expect(sha1Hex('hello')).toBe(sha1Hex('hello'));
  });
});
