import {
  defineKeyValueStore,
  InvalidScopeError,
  InvalidScopeErrorCode,
  kvsKey,
  KvsLogicalOperatorType,
  KvsQueryOperationType,
  KvsUpdateActionType,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { createScopedKvsTranslator } from './scopedKvsTranslator';

const stringStore = defineKeyValueStore('stringStore', 'id');
const numberStore = defineKeyValueStore('numberStore', kvsKey('seq', 'number'));
const scopedStore = defineKeyValueStore('scopedStore', 'id', [], { scoped: true });

const expectInvalidScope = (fn: () => unknown, code: InvalidScopeErrorCode) => {
  try {
    fn();
    expect.unreachable('expected InvalidScopeError');
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidScopeError);
    expect((error as InvalidScopeError).code).toBe(code);
  }
};

describe('createScopedKvsTranslator (unscoped)', () => {
  it('excludes scope-composed rows from an unscoped scan', () => {
    const translator = createScopedKvsTranslator(undefined, stringStore);

    expect(translator.scanFilter(undefined)).toEqual({
      key: 'id',
      operation: KvsQueryOperationType.NotContains,
      valueA: '@@QPQSCOPE@@',
    });
  });

  it('ANDs the composed-row exclusion onto an existing unscoped scan filter', () => {
    const translator = createScopedKvsTranslator(undefined, stringStore);
    const filter = { key: 'status', operation: KvsQueryOperationType.Equal, valueA: 'active' };

    expect(translator.scanFilter(filter)).toEqual({
      operation: KvsLogicalOperatorType.And,
      conditions: [{ key: 'id', operation: KvsQueryOperationType.NotContains, valueA: '@@QPQSCOPE@@' }, filter],
    });
  });

  it('stays a pure passthrough when the partition key is non-string', () => {
    const translator = createScopedKvsTranslator(undefined, numberStore);
    const filter = { key: 'status', operation: KvsQueryOperationType.Equal, valueA: 'active' };

    expect(translator.scanFilter(undefined)).toBeUndefined();
    expect(translator.scanFilter(filter)).toBe(filter);
  });

  it('leaves the other unscoped operations untouched', () => {
    const translator = createScopedKvsTranslator(undefined, stringStore);
    const item = { id: 'a', name: 'n' };
    const condition = { key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'a' };

    expect(translator.key('a')).toBe('a');
    expect(translator.item(item)).toBe(item);
    expect(translator.keyCondition(condition)).toBe(condition);
    expect(translator.filter(condition)).toBe(condition);
    expect(translator.strip(item)).toBe(item);
  });

  it('rejects the reserved delimiter in unscoped keys, items, and key conditions', () => {
    // An unscoped raw pk value 'acme@@QPQSCOPE@@secret' would read or forge scope
    // acme's composed rows, so it is rejected instead of matched.
    const translator = createScopedKvsTranslator(undefined, stringStore);

    expectInvalidScope(() => translator.key('acme@@QPQSCOPE@@secret'), InvalidScopeErrorCode.reservedDelimiter);
    expectInvalidScope(() => translator.item({ id: 'acme@@QPQSCOPE@@secret', name: 'n' }), InvalidScopeErrorCode.reservedDelimiter);
    expectInvalidScope(
      () => translator.keyCondition({ key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'acme@@QPQSCOPE@@secret' }),
      InvalidScopeErrorCode.reservedDelimiter,
    );
  });
});

describe('createScopedKvsTranslator (scoped)', () => {
  const translator = createScopedKvsTranslator('scope-a', scopedStore);

  it('scopes a scan by begins-with on the pk', () => {
    expect(translator.scanFilter(undefined)).toEqual({
      key: 'id',
      operation: KvsQueryOperationType.BeginsWith,
      valueA: 'scope-a@@QPQSCOPE@@',
    });
  });

  it('ANDs the begins-with predicate onto a rewritten scan filter', () => {
    const filter = { key: 'status', operation: KvsQueryOperationType.Equal, valueA: 'active' };

    expect(translator.scanFilter(filter)).toEqual({
      operation: KvsLogicalOperatorType.And,
      conditions: [{ key: 'id', operation: KvsQueryOperationType.BeginsWith, valueA: 'scope-a@@QPQSCOPE@@' }, filter],
    });
  });

  it('composes a bare key', () => {
    expect(translator.key('item-1')).toBe('scope-a@@QPQSCOPE@@item-1');
  });

  it('clones an item with its pk field composed, leaving the original untouched', () => {
    const item = { id: 'item-1', name: 'n' };

    expect(translator.item(item)).toEqual({ id: 'scope-a@@QPQSCOPE@@item-1', name: 'n' });
    expect(item).toEqual({ id: 'item-1', name: 'n' });
  });

  it('composes pk legs of a key condition and rejects one that never constrains the pk', () => {
    expect(translator.keyCondition({ key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'item-1' })).toEqual({
      key: 'id',
      operation: KvsQueryOperationType.Equal,
      valueA: 'scope-a@@QPQSCOPE@@item-1',
    });

    expectInvalidScope(
      () => translator.keyCondition({ key: 'name', operation: KvsQueryOperationType.Equal, valueA: 'x' }),
      InvalidScopeErrorCode.queryMissingPartitionKey,
    );
  });

  it('rewrites pk legs of an optional filter and passes undefined through', () => {
    const filter = {
      operation: KvsLogicalOperatorType.And,
      conditions: [
        { key: 'id', operation: KvsQueryOperationType.BeginsWith, valueA: 'item' },
        { key: 'status', operation: KvsQueryOperationType.Equal, valueA: 'active' },
      ],
    };

    expect(translator.filter(filter)).toEqual({
      operation: KvsLogicalOperatorType.And,
      conditions: [
        { key: 'id', operation: KvsQueryOperationType.BeginsWith, valueA: 'scope-a@@QPQSCOPE@@item' },
        { key: 'status', operation: KvsQueryOperationType.Equal, valueA: 'active' },
      ],
    });
    expect(translator.filter(undefined)).toBeUndefined();
  });

  it('strips the composed pk off returned items and passes null-ish results through', () => {
    expect(translator.strip({ id: 'scope-a@@QPQSCOPE@@item-1', name: 'n' })).toEqual({ id: 'item-1', name: 'n' });
    expect(translator.strip(null)).toBeNull();
    expect(translator.strip(undefined)).toBeUndefined();
  });
});

type Order = { id: string; createdAt: string; updatedAt: string; customerId: string; level: number; score: number; status: string };

// A string and a number GSI partition key on hidden copies, and one sharing the table pk (no copy).
const ordersStore = defineKeyValueStore<Order>('orders', 'id', [], {
  scoped: true,
  indexes: [
    { partitionKey: 'customerId', sortKey: 'createdAt' },
    { partitionKey: kvsKey('level', 'number'), sortKey: kvsKey('score', 'number') },
    { partitionKey: 'id', sortKey: 'updatedAt' },
  ],
});

describe('createScopedKvsTranslator (scoped GSIs)', () => {
  const translator = createScopedKvsTranslator('scope-a', ordersStore);

  it('sets a hidden copy per GSI partition key, stringifying numbers, and none for the index sharing the pk', () => {
    const item = { id: 'o-1', customerId: 'c-9', level: 3, updatedAt: '2026-09-24' };

    expect(translator.item(item)).toEqual({
      ...item,
      id: 'scope-a@@QPQSCOPE@@o-1',
      '@@QPQGSI_customerId@@': 'scope-a@@QPQSCOPE@@c-9',
      '@@QPQGSI_level@@': 'scope-a@@QPQSCOPE@@3',
    });
    expect(item).not.toHaveProperty('@@QPQGSI_customerId@@');
  });

  it('leaves a row without the source attribute out of that index', () => {
    expect(translator.item({ id: 'o-1', customerId: 'c-9', level: null })).toEqual({
      id: 'scope-a@@QPQSCOPE@@o-1',
      customerId: 'c-9',
      level: null,
      '@@QPQGSI_customerId@@': 'scope-a@@QPQSCOPE@@c-9',
    });
  });

  it('files the same value under a different partition per scope', () => {
    const hiddenCopy = (stored: Record<string, unknown>) => stored['@@QPQGSI_customerId@@'];
    const item = { id: 'o-1', customerId: 'c-9' };

    expect(hiddenCopy(translator.item(item))).not.toBe(hiddenCopy(createScopedKvsTranslator('scope-b', ordersStore).item(item)));
  });

  it('refuses a caller-supplied hidden copy, even without its source', () => {
    expectInvalidScope(
      () => translator.item({ id: 'o-1', '@@QPQGSI_customerId@@': 'scope-b@@QPQSCOPE@@c-9' }),
      InvalidScopeErrorCode.reservedAttribute,
    );
  });

  it("points the chosen GSI's partition key condition at its hidden copy and leaves the sort key raw", () => {
    const keyCondition = {
      operation: KvsLogicalOperatorType.And,
      conditions: [
        { key: 'level', operation: KvsQueryOperationType.Equal, valueA: 3 },
        { key: 'score', operation: KvsQueryOperationType.GreaterThan, valueA: 500 },
      ],
    };

    expect(translator.keyCondition(keyCondition, 'level')).toEqual({
      operation: KvsLogicalOperatorType.And,
      conditions: [
        { key: '@@QPQGSI_level@@', operation: KvsQueryOperationType.Equal, valueA: 'scope-a@@QPQSCOPE@@3' },
        { key: 'score', operation: KvsQueryOperationType.GreaterThan, valueA: 500 },
      ],
    });
  });

  it('composes the pk on the index that shares it, with no hidden copy involved', () => {
    expect(translator.keyCondition({ key: 'id', operation: KvsQueryOperationType.Equal, valueA: 'o-1' }, 'id')).toEqual({
      key: 'id',
      operation: KvsQueryOperationType.Equal,
      valueA: 'scope-a@@QPQSCOPE@@o-1',
    });
  });

  it('refuses a non-equality GSI partition key condition before rewriting anything', () => {
    expectInvalidScope(
      () => translator.keyCondition({ key: 'customerId', operation: KvsQueryOperationType.BeginsWith, valueA: 'c-' }, 'customerId'),
      InvalidScopeErrorCode.unsupportedOperation,
    );
  });

  it('mirrors Set, SetIfNotExists and Remove on GSI partition keys onto their hidden copies', () => {
    expect(
      translator.update([
        { attributePath: 'customerId', action: KvsUpdateActionType.Set, value: 'c-2' },
        { attributePath: ['level'], action: KvsUpdateActionType.SetIfNotExists, value: 4 },
        { attributePath: 'customerId', action: KvsUpdateActionType.Remove },
        { attributePath: 'status', action: KvsUpdateActionType.Set, value: 'paid' },
      ]),
    ).toEqual([
      { attributePath: 'customerId', action: KvsUpdateActionType.Set, value: 'c-2' },
      { attributePath: '@@QPQGSI_customerId@@', action: KvsUpdateActionType.Set, value: 'scope-a@@QPQSCOPE@@c-2' },
      { attributePath: ['level'], action: KvsUpdateActionType.SetIfNotExists, value: 4 },
      { attributePath: '@@QPQGSI_level@@', action: KvsUpdateActionType.SetIfNotExists, value: 'scope-a@@QPQSCOPE@@4' },
      { attributePath: 'customerId', action: KvsUpdateActionType.Remove },
      { attributePath: '@@QPQGSI_customerId@@', action: KvsUpdateActionType.Remove },
      { attributePath: 'status', action: KvsUpdateActionType.Set, value: 'paid' },
    ]);
  });

  it('refuses an update to a GSI partition key whose result is not known up front', () => {
    expectInvalidScope(
      () => translator.update([{ attributePath: 'level', action: KvsUpdateActionType.Increment, value: 1, defaultValue: 0 }]),
      InvalidScopeErrorCode.unsupportedOperation,
    );
  });

  it('strips hidden copies and the composed pk off returned items', () => {
    expect(
      translator.strip({
        id: 'scope-a@@QPQSCOPE@@o-1',
        customerId: 'c-9',
        '@@QPQGSI_customerId@@': 'scope-a@@QPQSCOPE@@c-9',
      }),
    ).toEqual({ id: 'o-1', customerId: 'c-9' });
  });

  it('leaves an unscoped store with GSIs on its raw attributes', () => {
    const open = defineKeyValueStore<Order>('open', 'id', [], { indexes: ['customerId'] });
    const unscoped = createScopedKvsTranslator(undefined, open);
    const item = { id: 'o-1', customerId: 'c-9' };
    const keyCondition = { key: 'customerId', operation: KvsQueryOperationType.Equal, valueA: 'c-9' };
    const updates = [{ attributePath: 'customerId', action: KvsUpdateActionType.Set, value: 'c-2' }];

    expect(unscoped.item(item)).toBe(item);
    expect(unscoped.keyCondition(keyCondition, 'customerId')).toBe(keyCondition);
    expect(unscoped.update(updates)).toBe(updates);
  });
});
