import { KvsLogicalOperatorType, KvsQueryCondition, KvsQueryOperationType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { buildDynamoQueryExpression } from './buildDynamoQueryExpression';
import { getItemName } from './getItemName';
import { getValueName } from './getValueName';

const condition = (overrides: Partial<KvsQueryCondition>): KvsQueryCondition => ({
  key: 'age',
  operation: KvsQueryOperationType.Equal,
  ...overrides,
});

describe('buildDynamoQueryExpression', () => {
  it('returns undefined when no query is given', () => {
    expect(buildDynamoQueryExpression()).toBeUndefined();
  });

  it.each([
    [KvsQueryOperationType.Equal, '='],
    [KvsQueryOperationType.NotEqual, '<>'],
    [KvsQueryOperationType.LessThan, '<'],
    [KvsQueryOperationType.LessThanOrEqual, '<='],
    [KvsQueryOperationType.GreaterThan, '>'],
    [KvsQueryOperationType.GreaterThanOrEqual, '>='],
  ])('renders %s as a binary comparison', (operation: KvsQueryOperationType, symbol: string) => {
    expect(buildDynamoQueryExpression(condition({ operation, valueA: 5 }))).toBe(`${getItemName('age')} ${symbol} ${getValueName(5)}`);
  });

  it('renders BETWEEN with both bounds', () => {
    const query = condition({ operation: KvsQueryOperationType.Between, valueA: 1, valueB: 9 });

    expect(buildDynamoQueryExpression(query)).toBe(`${getItemName('age')} BETWEEN ${getValueName(1)} AND ${getValueName(9)}`);
  });

  it('renders BETWEEN with falsy (zero) bounds', () => {
    const query = condition({ operation: KvsQueryOperationType.Between, valueA: 0, valueB: 0 });

    expect(buildDynamoQueryExpression(query)).toBe(`${getItemName('age')} BETWEEN ${getValueName(0)} AND ${getValueName(0)}`);
  });

  it('throws when BETWEEN is missing a bound', () => {
    expect(() => buildDynamoQueryExpression(condition({ operation: KvsQueryOperationType.Between, valueB: 9 }))).toThrow('Invalid query condition');
    expect(() => buildDynamoQueryExpression(condition({ operation: KvsQueryOperationType.Between, valueA: 1 }))).toThrow('Invalid query condition');
  });

  it('throws when a comparison condition is missing its value', () => {
    expect(() => buildDynamoQueryExpression(condition({ operation: KvsQueryOperationType.Equal }))).toThrow('Invalid query condition');
    expect(() => buildDynamoQueryExpression(condition({ operation: KvsQueryOperationType.BeginsWith }))).toThrow('Invalid query condition');
  });

  it('renders IN over each value', () => {
    const query = condition({ operation: KvsQueryOperationType.In, valueA: ['a', 'b'] });

    expect(buildDynamoQueryExpression(query)).toBe(`${getItemName('age')} IN (${getValueName('a')}, ${getValueName('b')})`);
  });

  it('throws when IN is not given an array of values', () => {
    expect(() => buildDynamoQueryExpression(condition({ operation: KvsQueryOperationType.In, valueA: 'a' }))).toThrow('Invalid query condition');
  });

  it.each([
    [KvsQueryOperationType.Exists, `attribute_exists(${getItemName('age')})`],
    [KvsQueryOperationType.NotExists, `attribute_not_exists(${getItemName('age')})`],
  ])('renders %s as a function', (operation: KvsQueryOperationType, expected: string) => {
    expect(buildDynamoQueryExpression(condition({ operation }))).toBe(expected);
  });

  it.each([
    [KvsQueryOperationType.BeginsWith, `begins_with(${getItemName('age')}, ${getValueName('a')})`],
    [KvsQueryOperationType.Contains, `contains(${getItemName('age')}, ${getValueName('a')})`],
    [KvsQueryOperationType.NotContains, `NOT contains(${getItemName('age')}, ${getValueName('a')})`],
  ])('renders %s', (operation: KvsQueryOperationType, expected: string) => {
    expect(buildDynamoQueryExpression(condition({ operation, valueA: 'a' }))).toBe(expected);
  });

  it('joins AND / OR conditions with parentheses', () => {
    const a = condition({ key: 'age', valueA: 1 });
    const b = condition({ key: 'name', valueA: 'x' });

    expect(buildDynamoQueryExpression({ operation: KvsLogicalOperatorType.And, conditions: [a, b] })).toBe(
      `(${getItemName('age')} = ${getValueName(1)}) AND (${getItemName('name')} = ${getValueName('x')})`,
    );
    expect(buildDynamoQueryExpression({ operation: KvsLogicalOperatorType.Or, conditions: [a, b] })).toBe(
      `(${getItemName('age')} = ${getValueName(1)}) OR (${getItemName('name')} = ${getValueName('x')})`,
    );
  });
});
