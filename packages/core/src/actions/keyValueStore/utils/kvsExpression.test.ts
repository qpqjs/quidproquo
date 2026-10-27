import { describe, expect, it } from 'vitest';

import { KvsLogicalOperatorType, KvsQueryOperationType } from '../types';
import {
  kvsAnd,
  kvsBeginsWith,
  kvsBetween,
  kvsContains,
  kvsEqual,
  kvsExists,
  kvsGreaterThan,
  kvsGreaterThanOrEqual,
  kvsIn,
  kvsLessThan,
  kvsLessThanOrEqual,
  kvsNotContains,
  kvsNotEqual,
  kvsNotExists,
  kvsOr,
} from './kvsExpression';

describe('kvsExpression', () => {
  it('builds single-value conditions with valueA set and valueB undefined', () => {
    expect(kvsEqual('age', 30)).toEqual({ key: 'age', operation: KvsQueryOperationType.Equal, valueA: 30, valueB: undefined });
    expect(kvsNotEqual('age', 30)).toEqual({ key: 'age', operation: KvsQueryOperationType.NotEqual, valueA: 30, valueB: undefined });
    expect(kvsLessThan('age', 30)).toEqual({ key: 'age', operation: KvsQueryOperationType.LessThan, valueA: 30, valueB: undefined });
    expect(kvsLessThanOrEqual('age', 30)).toEqual({ key: 'age', operation: KvsQueryOperationType.LessThanOrEqual, valueA: 30, valueB: undefined });
    expect(kvsGreaterThan('age', 30)).toEqual({ key: 'age', operation: KvsQueryOperationType.GreaterThan, valueA: 30, valueB: undefined });
    expect(kvsGreaterThanOrEqual('age', 30)).toEqual({
      key: 'age',
      operation: KvsQueryOperationType.GreaterThanOrEqual,
      valueA: 30,
      valueB: undefined,
    });
    expect(kvsIn('role', ['a', 'b'])).toEqual({ key: 'role', operation: KvsQueryOperationType.In, valueA: ['a', 'b'], valueB: undefined });
    expect(kvsBeginsWith('name', 'Al')).toEqual({ key: 'name', operation: KvsQueryOperationType.BeginsWith, valueA: 'Al', valueB: undefined });
    expect(kvsContains('tags', 'x')).toEqual({ key: 'tags', operation: KvsQueryOperationType.Contains, valueA: 'x', valueB: undefined });
    expect(kvsNotContains('tags', 'x')).toEqual({ key: 'tags', operation: KvsQueryOperationType.NotContains, valueA: 'x', valueB: undefined });
  });

  it('builds a Between condition carrying both bounds', () => {
    expect(kvsBetween('age', 18, 65)).toEqual({
      key: 'age',
      operation: KvsQueryOperationType.Between,
      valueA: 18,
      valueB: 65,
    });
  });

  it('builds existence conditions with both values undefined', () => {
    expect(kvsExists('email')).toEqual({ key: 'email', operation: KvsQueryOperationType.Exists, valueA: undefined, valueB: undefined });
    expect(kvsNotExists('email')).toEqual({ key: 'email', operation: KvsQueryOperationType.NotExists, valueA: undefined, valueB: undefined });
  });

  it('wraps conditions in an And logical operator', () => {
    const conditions = [kvsEqual('a', 1), kvsEqual('b', 2)];

    expect(kvsAnd(conditions)).toEqual({
      operation: KvsLogicalOperatorType.And,
      conditions,
    });
  });

  it('wraps conditions in an Or logical operator', () => {
    const conditions = [kvsEqual('a', 1), kvsEqual('b', 2)];

    expect(kvsOr(conditions)).toEqual({
      operation: KvsLogicalOperatorType.Or,
      conditions,
    });
  });
});
