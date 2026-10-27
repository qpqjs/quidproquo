import { describe, expect, it } from 'vitest';

import { isNeo4jScalarResult } from './isNeo4jScalarResult';

describe('isNeo4jScalarResult', () => {
  it.each([
    ['a number', 42],
    ['a string', 'hello'],
    ['a boolean', true],
    ['null', null],
  ])('accepts %s', (_label: string, value: any) => {
    expect(isNeo4jScalarResult(value)).toBe(true);
  });

  it.each([
    ['a node object', { elementId: '1', labels: ['Person'], properties: {} }],
    ['a relationship object', { elementId: '1', startNodeElementId: '2', endNodeElementId: '3', type: 'KNOWS', properties: {} }],
  ])('rejects %s', (_label: string, value: any) => {
    expect(isNeo4jScalarResult(value)).toBe(false);
  });
});
