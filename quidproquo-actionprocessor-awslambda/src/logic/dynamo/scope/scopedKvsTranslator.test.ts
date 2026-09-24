import {
  defineKeyValueStore,
  InvalidScopeError,
  InvalidScopeErrorCode,
  kvsKey,
  KvsLogicalOperatorType,
  KvsQueryOperationType,
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
