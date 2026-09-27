import { describe, expect, it } from 'vitest';

import { generateUuid, generateUuidFromRandomValues } from './generateUuid';

describe('generateUuid', () => {
  it('returns a string', () => {
    expect(typeof generateUuid()).toBe('string');
  });

  it('is exactly 36 characters long', () => {
    expect(generateUuid()).toHaveLength(36);
  });

  it('contains exactly 4 dashes', () => {
    const dashes = generateUuid()
      .split('')
      .filter((c) => c === '-').length;

    expect(dashes).toBe(4);
  });

  it('has dashes in the 8-4-4-4-12 positions', () => {
    const uuid = generateUuid();

    expect(uuid[8]).toBe('-');
    expect(uuid[13]).toBe('-');
    expect(uuid[18]).toBe('-');
    expect(uuid[23]).toBe('-');
  });

  it('splits into 5 groups of the correct lengths', () => {
    const groups = generateUuid().split('-');

    expect(groups.map((g) => g.length)).toEqual([8, 4, 4, 4, 12]);
  });

  it('only contains lowercase hex characters and dashes', () => {
    expect(generateUuid()).toMatch(/^[0-9a-f-]+$/);
  });

  it('contains no uppercase characters', () => {
    const uuid = generateUuid();

    expect(uuid).toBe(uuid.toLowerCase());
  });

  it('sets the version nibble to 4 (the 15th character)', () => {
    // RFC 4122: the first character of the 3rd group encodes the version.
    expect(generateUuid()[14]).toBe('4');
  });

  it('sets the variant nibble to one of 8, 9, a or b (the 20th character)', () => {
    // RFC 4122: the first character of the 4th group encodes the variant.
    expect(generateUuid()[19]).toMatch(/^[89ab]$/);
  });

  it('matches the canonical v4 UUID regex', () => {
    expect(generateUuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('produces a different value on each call', () => {
    expect(generateUuid()).not.toBe(generateUuid());
  });

  it('generates 10,000 unique values with no collisions', () => {
    const count = 10_000;
    const generated = new Set<string>();

    for (let i = 0; i < count; i++) {
      generated.add(generateUuid());
    }

    expect(generated.size).toBe(count);
  });

  it('produces a valid v4 UUID on every one of many iterations', () => {
    const v4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

    for (let i = 0; i < 1_000; i++) {
      expect(generateUuid()).toMatch(v4Regex);
    }
  });

  describe('without crypto.randomUUID (plain-http browser context)', () => {
    // Only getRandomValues is offered, as a browser does on an insecure origin.
    const insecureCrypto = { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) };

    it('still produces a v4 uuid of the same shape', () => {
      const uuid = generateUuidFromRandomValues(insecureCrypto);

      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });

    it('produces distinct values', () => {
      const uuids = new Set(Array.from({ length: 200 }, () => generateUuidFromRandomValues(insecureCrypto)));

      expect(uuids.size).toBe(200);
    });

    // The version and variant masks are the only part that can be subtly wrong,
    // and only show at the extremes: all-ones must be forced down to 4 / [89ab],
    // all-zeros must be forced up to them.
    const fixedBytes = (fill: number) => ({
      getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
        (array as unknown as Uint8Array).fill(fill);
        return array;
      },
    });

    it('sets the version and variant bits when every random byte is 0xff', () => {
      expect(generateUuidFromRandomValues(fixedBytes(0xff))).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    });

    it('sets the version and variant bits when every random byte is 0x00', () => {
      expect(generateUuidFromRandomValues(fixedBytes(0x00))).toBe('00000000-0000-4000-8000-000000000000');
    });
  });

  describe('without any Web Crypto API', () => {
    it('throws a clear error rather than a property-of-undefined crash', () => {
      const original = globalThis.crypto;
      Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });

      try {
        expect(() => generateUuid()).toThrow('no Web Crypto API available');
      } finally {
        Object.defineProperty(globalThis, 'crypto', { value: original, configurable: true });
      }
    });
  });
});
