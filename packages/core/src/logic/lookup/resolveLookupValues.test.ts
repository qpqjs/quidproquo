import { describe, expect, it } from 'vitest';

import { resolveLookupValues } from './resolveLookupValues';

enum Color {
  Red = 'red',
  Green = 'green',
  Blue = 'blue',
}

describe('resolveLookupValues', () => {
  it('resolves named lookups to their enum values', () => {
    expect(resolveLookupValues(['Red', 'Blue'], Color)).toEqual(['red', 'blue']);
  });

  it("expands 'All' to every enum value in declaration order", () => {
    expect(resolveLookupValues(['All'], Color)).toEqual(['red', 'green', 'blue']);
  });

  it('ignores keys that are not part of the enum', () => {
    expect(resolveLookupValues(['Red', 'Purple' as keyof typeof Color], Color)).toEqual(['red']);
  });
});
