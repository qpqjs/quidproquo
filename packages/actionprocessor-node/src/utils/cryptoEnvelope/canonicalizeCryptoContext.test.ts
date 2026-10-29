import { describe, expect, it } from 'vitest';

import { canonicalizeCryptoContext } from './canonicalizeCryptoContext';

describe('canonicalizeCryptoContext', () => {
  it('treats undefined and {} as equivalent (empty string)', () => {
    expect(canonicalizeCryptoContext(undefined)).toBe('');
    expect(canonicalizeCryptoContext({})).toBe('');
  });

  it('is independent of key insertion order', () => {
    expect(canonicalizeCryptoContext({ b: '2', a: '1' })).toBe(canonicalizeCryptoContext({ a: '1', b: '2' }));
  });

  it('cannot collide across key/value boundaries', () => {
    expect(canonicalizeCryptoContext({ ab: 'c' })).not.toBe(canonicalizeCryptoContext({ a: 'bc' }));
    expect(canonicalizeCryptoContext({ a: 'b', c: 'd' })).not.toBe(canonicalizeCryptoContext({ a: 'bc:d' }));
  });

  it('length-prefixes with byte length, not string length', () => {
    // '€' is 1 UTF-16 code unit but 3 UTF-8 bytes
    expect(canonicalizeCryptoContext({ a: '€' })).toBe('1:a3:€');
  });

  it('produces a stable encoding', () => {
    expect(canonicalizeCryptoContext({ tenantId: 'tenant-a' })).toBe('8:tenantId8:tenant-a');
  });
});
