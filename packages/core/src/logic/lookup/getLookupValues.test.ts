import { describe, expect, it } from 'vitest';

import { getLookupValues } from './getLookupValues';

enum Color {
  Red = 'red',
  Green = 'green',
}

describe('getLookupValues', () => {
  it("prepends 'All' to the enum's named keys", () => {
    expect(getLookupValues(Color)).toEqual(['All', 'Red', 'Green']);
  });

  it('drops reverse-mapped numeric keys of a numeric enum', () => {
    enum Size {
      Small,
      Large,
    }

    expect(getLookupValues(Size)).toEqual(['All', 'Small', 'Large']);
  });
});
