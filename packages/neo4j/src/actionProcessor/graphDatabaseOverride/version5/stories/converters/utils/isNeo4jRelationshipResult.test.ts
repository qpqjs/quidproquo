import { describe, expect, it } from 'vitest';

import { isNeo4jRelationshipResult } from './isNeo4jRelationshipResult';

describe('isNeo4jRelationshipResult', () => {
  it('returns true for a relationship object', () => {
    expect(isNeo4jRelationshipResult({ elementId: '1', startNodeElementId: '2', endNodeElementId: '3', type: 'KNOWS', properties: {} })).toBe(true);
  });

  it('returns false for a node object', () => {
    expect(isNeo4jRelationshipResult({ elementId: '1', labels: ['Person'], properties: {} })).toBe(false);
  });

  it.each([
    ['a number', 42],
    ['a string', 'hello'],
    ['a boolean', true],
    ['null', null],
  ])('returns false for %s', (_label: string, value: any) => {
    expect(isNeo4jRelationshipResult(value)).toBe(false);
  });
});
