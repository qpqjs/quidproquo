import { describe, expect, it } from 'vitest';

import { isValidKvsAdvancedDataType } from './isValidKvsAdvancedDataType';

describe('isValidKvsAdvancedDataType', () => {
  it.each([
    ['a string', 'hello'],
    ['a number', 42],
    ['a boolean', true],
    ['an array of primitives', [1, 'two', false]],
    ['a flat object', { a: 1, b: 'two', c: true }],
    ['a null-prototype object', Object.assign(Object.create(null), { a: 1 })],
  ])('accepts %s', (_label: string, value: unknown) => {
    expect(isValidKvsAdvancedDataType(value)).toBe(true);
  });

  it.each([
    ['a nested array', [[1, 2]]],
    ['an array of objects', [{ a: 1 }]],
    ['a nested object', { a: { b: 1 } }],
    ['null', null],
    ['a function', () => 1],
    ['a Date instance (would be stored as an empty object)', new Date()],
    ['a Map instance', new Map()],
  ])('rejects %s', (_label: string, value: unknown) => {
    expect(isValidKvsAdvancedDataType(value)).toBe(false);
  });
});
