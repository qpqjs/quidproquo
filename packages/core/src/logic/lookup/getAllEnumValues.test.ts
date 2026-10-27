import { describe, expect, it } from 'vitest';

import { getAllEnumValues } from './getAllEnumValues';

describe('getAllEnumValues', () => {
  it('returns the values of a string enum', () => {
    enum Color {
      Red = 'red',
      Green = 'green',
    }

    expect(getAllEnumValues(Color)).toEqual(['red', 'green']);
  });

  it('includes reverse-mapped names and numbers for a numeric enum', () => {
    enum Size {
      Small,
      Large,
    }

    expect(getAllEnumValues(Size)).toEqual(['Small', 'Large', 0, 1]);
  });

  it('returns an empty array for an empty object', () => {
    expect(getAllEnumValues({})).toEqual([]);
  });
});
