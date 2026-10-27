import { describe, expect, it } from 'vitest';

import { getItemName } from './getItemName';

describe('getItemName', () => {
  it('prefixes the hashed name with #', () => {
    expect(getItemName('age')).toMatch(/^#[0-9a-f]+$/);
  });

  it('is deterministic and distinguishes distinct names', () => {
    expect(getItemName('age')).toBe(getItemName('age'));
    expect(getItemName('age')).not.toBe(getItemName('name'));
  });
});
