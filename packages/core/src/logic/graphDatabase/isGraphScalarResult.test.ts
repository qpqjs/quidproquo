import { describe, expect, it } from 'vitest';

import { isGraphScalarResult } from './isGraphScalarResult';

describe('isGraphScalarResult', () => {
  it.each([
    ['a number', 42],
    ['a string', 'hello'],
    ['a boolean', true],
    ['null', null],
  ])('accepts %s', (_label: string, value: unknown) => {
    expect(isGraphScalarResult(value)).toBe(true);
  });

  it('rejects an object entity', () => {
    expect(isGraphScalarResult({ labels: [] })).toBe(false);
  });
});
