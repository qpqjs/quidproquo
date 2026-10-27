import { describe, expect, it } from 'vitest';

import { getValueName } from './getValueName';

describe('getValueName', () => {
  it('prefixes the hashed value with :', () => {
    expect(getValueName(30)).toMatch(/^:[0-9a-f]+$/);
  });

  it('is deterministic and distinguishes distinct values', () => {
    expect(getValueName(1)).toBe(getValueName(1));
    expect(getValueName(1)).not.toBe(getValueName(2));
  });

  it('distinguishes values that are equal only after coercion', () => {
    expect(getValueName(1)).not.toBe(getValueName('1'));
  });
});
