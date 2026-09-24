import { describe, expect, it } from 'vitest';

import { KvsLogicalOperatorType, KvsQueryOperationType } from '../../actions/keyValueStore/types';
import { defineKeyValueStore, kvsKey } from '../../config';
import { InvalidScopeError, InvalidScopeErrorCode } from './InvalidScopeError';
import {
  validateKvsFilterForScopeOrThrow,
  validateKvsKeyConditionForScopeOrThrow,
  validateKvsPkValueForScopeOrThrow,
  validateUnscopedPkConditionValuesOrThrow,
} from './kvsScopeRules';

const expectInvalidScope = (fn: () => unknown, code: InvalidScopeErrorCode) => {
  try {
    fn();
    expect.unreachable('expected InvalidScopeError');
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidScopeError);
    expect((error as InvalidScopeError).code).toBe(code);
  }
};

const stringStore = defineKeyValueStore('stringStore', 'id');
const numberStore = defineKeyValueStore('numberStore', kvsKey('seq', 'number'));
const scopedStore = defineKeyValueStore('scopedStore', 'id', [], { scoped: true });

describe('validateKvsPkValueForScopeOrThrow', () => {
  it('passes clean values, including ones containing "::" (correlation ids)', () => {
    expect(() => validateKvsPkValueForScopeOrThrow(scopedStore, 'scope-a', 'item-1')).not.toThrow();
    expect(() => validateKvsPkValueForScopeOrThrow(scopedStore, 'scope-a', 'onCreate::onCreate')).not.toThrow();
    expect(() => validateKvsPkValueForScopeOrThrow(stringStore, undefined, 'onCreate::onCreate')).not.toThrow();
  });

  it('rejects a non-string value under a scope', () => {
    expectInvalidScope(() => validateKvsPkValueForScopeOrThrow(scopedStore, 'scope-a', 42), InvalidScopeErrorCode.unsafeCharacters);
  });

  it('rejects the reserved marker, scoped or unscoped on a string pk', () => {
    expectInvalidScope(() => validateKvsPkValueForScopeOrThrow(scopedStore, 'scope-a', 'x@@QPQSCOPE@@y'), InvalidScopeErrorCode.reservedDelimiter);
    expectInvalidScope(
      () => validateKvsPkValueForScopeOrThrow(stringStore, undefined, 'acme@@QPQSCOPE@@secret'),
      InvalidScopeErrorCode.reservedDelimiter,
    );
  });

  it('leaves an unscoped number-pk store unchecked', () => {
    expect(() => validateKvsPkValueForScopeOrThrow(numberStore, undefined, 'acme@@QPQSCOPE@@secret')).not.toThrow();
  });
});

describe('validateKvsKeyConditionForScopeOrThrow', () => {
  it('passes a scoped query that constrains the partition key', () => {
    expect(() =>
      validateKvsKeyConditionForScopeOrThrow(scopedStore, 'scope-a', { key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'x' }),
    ).not.toThrow();
  });

  it('rejects a scoped query that never constrains the partition key', () => {
    expectInvalidScope(
      () => validateKvsKeyConditionForScopeOrThrow(scopedStore, 'scope-a', { key: 'name', operation: KvsQueryOperationType.Equal, valueA: 'x' }),
      InvalidScopeErrorCode.queryMissingPartitionKey,
    );
  });

  it('rejects an operation on the partition key that cannot be scoped', () => {
    expectInvalidScope(
      () => validateKvsKeyConditionForScopeOrThrow(scopedStore, 'scope-a', { key: 'id', operation: KvsQueryOperationType.NotEqual, valueA: 'x' }),
      InvalidScopeErrorCode.unsafeCharacters,
    );
  });

  it('rejects a non-string bound on the partition key', () => {
    expectInvalidScope(
      () =>
        validateKvsKeyConditionForScopeOrThrow(scopedStore, 'scope-a', {
          key: 'id',
          operation: KvsQueryOperationType.Between,
          valueA: 'a',
          valueB: true,
        }),
      InvalidScopeErrorCode.unsafeCharacters,
    );
  });

  it('checks unscoped pk comparisons on a string pk only for the reserved marker', () => {
    const marked = { key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'acme@@QPQSCOPE@@secret' };

    expect(() =>
      validateKvsKeyConditionForScopeOrThrow(stringStore, undefined, { key: 'name', operation: KvsQueryOperationType.Equal, valueA: 'x' }),
    ).not.toThrow();
    expectInvalidScope(() => validateKvsKeyConditionForScopeOrThrow(stringStore, undefined, marked), InvalidScopeErrorCode.reservedDelimiter);
    expect(() => validateKvsKeyConditionForScopeOrThrow(numberStore, undefined, { ...marked, key: 'seq' })).not.toThrow();
  });
});

describe('validateKvsFilterForScopeOrThrow', () => {
  it('checks pk legs of a scoped filter without requiring one', () => {
    expect(() =>
      validateKvsFilterForScopeOrThrow(scopedStore, 'scope-a', { key: 'status', operation: KvsQueryOperationType.Equal, valueA: 'active' }),
    ).not.toThrow();
    expectInvalidScope(
      () => validateKvsFilterForScopeOrThrow(scopedStore, 'scope-a', { key: 'id', operation: KvsQueryOperationType.Contains, valueA: 'x' }),
      InvalidScopeErrorCode.unsafeCharacters,
    );
  });

  it('leaves unscoped and absent filters unchecked', () => {
    expect(() =>
      validateKvsFilterForScopeOrThrow(stringStore, undefined, { key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'acme@@QPQSCOPE@@x' }),
    ).not.toThrow();
    expect(() => validateKvsFilterForScopeOrThrow(scopedStore, 'scope-a', undefined)).not.toThrow();
  });
});

describe('validateUnscopedPkConditionValuesOrThrow', () => {
  it('passes clean pk comparisons and ignores non-pk conditions', () => {
    const operation = {
      operation: KvsLogicalOperatorType.And,
      conditions: [
        { key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'item-1' },
        // Non-pk conditions may legitimately contain '@@QPQSCOPE@@' (it is only reserved in the pk).
        { key: 'note', operation: KvsQueryOperationType.Equal, valueA: 'a@@QPQSCOPE@@b' },
      ],
    };

    expect(() => validateUnscopedPkConditionValuesOrThrow(operation, ['id'])).not.toThrow();
  });

  it('rejects the reserved marker in a pk comparison, including nested trees and In lists', () => {
    // An unscoped pk value 'acme@@QPQSCOPE@@secret' would match scope acme's composed rows.
    expectInvalidScope(
      () => validateUnscopedPkConditionValuesOrThrow({ key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'acme@@QPQSCOPE@@secret' }, ['id']),
      InvalidScopeErrorCode.reservedDelimiter,
    );

    const nested = {
      operation: KvsLogicalOperatorType.Or,
      conditions: [
        { key: 'name', operation: KvsQueryOperationType.Equal, valueA: 'x' },
        {
          operation: KvsLogicalOperatorType.And,
          conditions: [{ key: 'id', operation: KvsQueryOperationType.In, valueA: ['ok', 'acme@@QPQSCOPE@@secret'] }],
        },
      ],
    };
    expectInvalidScope(() => validateUnscopedPkConditionValuesOrThrow(nested, ['id']), InvalidScopeErrorCode.reservedDelimiter);

    expectInvalidScope(
      () =>
        validateUnscopedPkConditionValuesOrThrow({ key: 'id', operation: KvsQueryOperationType.Between, valueA: 'a', valueB: 'acme@@QPQSCOPE@@z' }, [
          'id',
        ]),
      InvalidScopeErrorCode.reservedDelimiter,
    );
  });
});
