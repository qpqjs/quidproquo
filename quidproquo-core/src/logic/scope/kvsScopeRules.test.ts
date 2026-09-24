import { describe, expect, it } from 'vitest';

import { KvsLogicalOperatorType, KvsQueryOperationType, KvsUpdateActionType } from '../../actions/keyValueStore/types';
import { defineKeyValueStore, kvsKey } from '../../config';
import { InvalidScopeError, InvalidScopeErrorCode } from './InvalidScopeError';
import {
  getScopedKvsIndexPartitionKeys,
  validateKvsFilterForScopeOrThrow,
  validateKvsItemForScopeOrThrow,
  validateKvsKeyConditionForScopeOrThrow,
  validateKvsPkValueForScopeOrThrow,
  validateKvsUpdatesForScopeOrThrow,
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

type Order = { id: string; createdAt: string; updatedAt: string; customerId: string; level: number; score: number };

// A string and a number GSI partition key, plus one sharing the table pk (no per-scope copy needed).
const ordersStore = defineKeyValueStore<Order>('orders', 'id', [], {
  scoped: true,
  indexes: [
    { partitionKey: 'customerId', sortKey: 'createdAt' },
    { partitionKey: kvsKey('level', 'number'), sortKey: kvsKey('score', 'number') },
    { partitionKey: 'id', sortKey: 'updatedAt' },
  ],
});

describe('getScopedKvsIndexPartitionKeys', () => {
  it('lists each scoped GSI partition key once, leaving out the table pk', () => {
    const store = defineKeyValueStore<Order>('shared', 'id', [], {
      scoped: true,
      indexes: [{ partitionKey: 'customerId', sortKey: 'createdAt' }, { partitionKey: 'customerId', sortKey: 'updatedAt' }, 'id'],
    });

    expect(getScopedKvsIndexPartitionKeys(store)).toEqual([{ key: 'customerId', type: 'string' }]);
    expect(getScopedKvsIndexPartitionKeys(ordersStore).map((key) => key.key)).toEqual(['customerId', 'level']);
  });

  it('is empty on an unscoped store', () => {
    expect(getScopedKvsIndexPartitionKeys(defineKeyValueStore<Order>('open', 'id', [], { indexes: ['customerId'] }))).toEqual([]);
  });
});

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

  it('reserves the whole @@QPQ marker, not just the scope delimiter', () => {
    expectInvalidScope(() => validateKvsPkValueForScopeOrThrow(stringStore, undefined, 'a@@QPQb'), InvalidScopeErrorCode.reservedDelimiter);
  });

  it('leaves an unscoped number-pk store unchecked', () => {
    expect(() => validateKvsPkValueForScopeOrThrow(numberStore, undefined, 'acme@@QPQSCOPE@@secret')).not.toThrow();
  });
});

describe('validateKvsItemForScopeOrThrow', () => {
  it('passes a scoped item with correctly typed index keys, and one that leaves an index key out', () => {
    expect(() => validateKvsItemForScopeOrThrow(ordersStore, 'scope-a', { id: 'o-1', customerId: 'c-9', level: 3 })).not.toThrow();
    expect(() => validateKvsItemForScopeOrThrow(ordersStore, 'scope-a', { id: 'o-1', level: null })).not.toThrow();
  });

  it('rejects an attribute name carrying the reserved marker on a scoped store only', () => {
    const item = { id: 'o-1', '@@QPQGSI_customerId@@': 'scope-b@@QPQSCOPE@@c-9' };

    expectInvalidScope(() => validateKvsItemForScopeOrThrow(ordersStore, 'scope-a', item), InvalidScopeErrorCode.reservedAttribute);
    expect(() => validateKvsItemForScopeOrThrow(stringStore, undefined, item)).not.toThrow();
  });

  it('rejects an index key value that does not match its declared type', () => {
    expectInvalidScope(
      () => validateKvsItemForScopeOrThrow(ordersStore, 'scope-a', { id: 'o-1', customerId: 9 }),
      InvalidScopeErrorCode.indexKeyType,
    );
    expectInvalidScope(() => validateKvsItemForScopeOrThrow(ordersStore, 'scope-a', { id: 'o-1', level: '3' }), InvalidScopeErrorCode.indexKeyType);
    expectInvalidScope(
      () => validateKvsItemForScopeOrThrow(ordersStore, 'scope-a', { id: 'o-1', level: Number.NaN }),
      InvalidScopeErrorCode.indexKeyType,
    );
  });

  it('still applies the pk value rule', () => {
    expectInvalidScope(() => validateKvsItemForScopeOrThrow(ordersStore, 'scope-a', { id: 42 }), InvalidScopeErrorCode.unsafeCharacters);
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

  it('passes a scoped query on an index partition key with equality, sort key conditions untouched', () => {
    const keyCondition = {
      operation: KvsLogicalOperatorType.And,
      conditions: [
        { key: 'level', operation: KvsQueryOperationType.Equal, valueA: 3 },
        { key: 'score', operation: KvsQueryOperationType.GreaterThan, valueA: 500 },
      ],
    };

    expect(() => validateKvsKeyConditionForScopeOrThrow(ordersStore, 'scope-a', keyCondition)).not.toThrow();
  });

  it('rejects anything but equality on a scoped index partition key, and a mistyped value', () => {
    expectInvalidScope(
      () =>
        validateKvsKeyConditionForScopeOrThrow(ordersStore, 'scope-a', {
          key: 'customerId',
          operation: KvsQueryOperationType.BeginsWith,
          valueA: 'c-',
        }),
      InvalidScopeErrorCode.unsupportedOperation,
    );
    expectInvalidScope(
      () => validateKvsKeyConditionForScopeOrThrow(ordersStore, 'scope-a', { key: 'level', operation: KvsQueryOperationType.Equal, valueA: '3' }),
      InvalidScopeErrorCode.indexKeyType,
    );
  });

  it('rejects a scoped key condition naming a reserved-marker attribute', () => {
    expectInvalidScope(
      () =>
        validateKvsKeyConditionForScopeOrThrow(ordersStore, 'scope-a', {
          key: '@@QPQGSI_customerId@@',
          operation: KvsQueryOperationType.Equal,
          valueA: 'scope-b@@QPQSCOPE@@c-9',
        }),
      InvalidScopeErrorCode.reservedAttribute,
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

  it('rejects a scoped filter naming a reserved-marker attribute', () => {
    expectInvalidScope(
      () => validateKvsFilterForScopeOrThrow(ordersStore, 'scope-a', { key: '@@QPQGSI_customerId@@', operation: KvsQueryOperationType.Exists }),
      InvalidScopeErrorCode.reservedAttribute,
    );
  });

  it('leaves unscoped and absent filters unchecked', () => {
    expect(() =>
      validateKvsFilterForScopeOrThrow(stringStore, undefined, { key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'acme@@QPQSCOPE@@x' }),
    ).not.toThrow();
    expect(() => validateKvsFilterForScopeOrThrow(scopedStore, 'scope-a', undefined)).not.toThrow();
  });
});

describe('validateKvsUpdatesForScopeOrThrow', () => {
  it('passes Set, SetIfNotExists and Remove on scoped index keys, and anything on other attributes', () => {
    expect(() =>
      validateKvsUpdatesForScopeOrThrow(ordersStore, 'scope-a', [
        { attributePath: 'customerId', action: KvsUpdateActionType.Set, value: 'c-2' },
        { attributePath: ['level'], action: KvsUpdateActionType.SetIfNotExists, value: 4 },
        { attributePath: 'customerId', action: KvsUpdateActionType.Remove },
        { attributePath: 'score', action: KvsUpdateActionType.Increment, value: 1, defaultValue: 0 },
      ]),
    ).not.toThrow();
  });

  it('rejects updates to a scoped index key whose result is not known up front', () => {
    expectInvalidScope(
      () =>
        validateKvsUpdatesForScopeOrThrow(ordersStore, 'scope-a', [
          { attributePath: 'level', action: KvsUpdateActionType.Increment, value: 1, defaultValue: 0 },
        ]),
      InvalidScopeErrorCode.unsupportedOperation,
    );
    expectInvalidScope(
      () => validateKvsUpdatesForScopeOrThrow(ordersStore, 'scope-a', [{ attributePath: 'level', action: KvsUpdateActionType.Add, value: 1 }]),
      InvalidScopeErrorCode.unsupportedOperation,
    );
    expectInvalidScope(
      () =>
        validateKvsUpdatesForScopeOrThrow(ordersStore, 'scope-a', [
          { attributePath: ['customerId', 'part'], action: KvsUpdateActionType.Set, value: 'x' },
        ]),
      InvalidScopeErrorCode.unsupportedOperation,
    );
  });

  it('rejects a mistyped index key value and a reserved-marker path', () => {
    expectInvalidScope(
      () => validateKvsUpdatesForScopeOrThrow(ordersStore, 'scope-a', [{ attributePath: 'level', action: KvsUpdateActionType.Set, value: '4' }]),
      InvalidScopeErrorCode.indexKeyType,
    );
    expectInvalidScope(
      () =>
        validateKvsUpdatesForScopeOrThrow(ordersStore, 'scope-a', [
          { attributePath: ['@@QPQGSI_customerId@@'], action: KvsUpdateActionType.Set, value: 'x' },
        ]),
      InvalidScopeErrorCode.reservedAttribute,
    );
  });

  it('leaves unscoped updates unchecked', () => {
    expect(() =>
      validateKvsUpdatesForScopeOrThrow(stringStore, undefined, [{ attributePath: '@@QPQGSI_x@@', action: KvsUpdateActionType.Increment, value: 1 }]),
    ).not.toThrow();
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
