import {
  buildTestQpqConfig,
  defineKeyValueStore,
  InvalidScopeError,
  InvalidScopeErrorCode,
  kvsKey,
  KvsQueryOperationType,
  KvsStoreNotFoundError,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getScopedKvsTranslatorOrThrow } from './getScopedKvsTranslatorOrThrow';

const qpqConfig = buildTestQpqConfig([
  defineKeyValueStore('stringStore', kvsKey('id', 'string')),
  defineKeyValueStore('numberStore', kvsKey('seq', 'number')),
  defineKeyValueStore('scopedStringStore', kvsKey('id', 'string'), [], { scoped: true }),
  defineKeyValueStore('scopedNumberStore', kvsKey('seq', 'number'), [], { scoped: true }),
]);

const expectInvalidScope = (fn: () => unknown, code: InvalidScopeErrorCode) => {
  try {
    fn();
    expect.unreachable('expected InvalidScopeError');
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidScopeError);
    expect((error as InvalidScopeError).code).toBe(code);
  }
};

describe('getScopedKvsTranslatorOrThrow', () => {
  it('returns a composing translator for a valid scope on a string-pk store', () => {
    const translator = getScopedKvsTranslatorOrThrow(qpqConfig, 'scopedStringStore', 'scope-a');

    expect(translator.key('item-1')).toBe('scope-a@@QPQSCOPE@@item-1');
  });

  it('returns the unscoped translator with the composed-row scan exclusion for a string-pk store', () => {
    const translator = getScopedKvsTranslatorOrThrow(qpqConfig, 'stringStore', undefined);

    expect(translator.key('item-1')).toBe('item-1');
    expect(translator.scanFilter(undefined)).toEqual({ key: 'id', operation: KvsQueryOperationType.NotContains, valueA: '@@QPQSCOPE@@' });
  });

  it('returns a pure passthrough for an unscoped number-pk store', () => {
    const translator = getScopedKvsTranslatorOrThrow(qpqConfig, 'numberStore', undefined);

    expect(translator.scanFilter(undefined)).toBeUndefined();
  });

  it('rejects an invalid scope, a number-pk store, and an unknown store', () => {
    expectInvalidScope(() => getScopedKvsTranslatorOrThrow(qpqConfig, 'scopedStringStore', '../evil'), InvalidScopeErrorCode.unsafeCharacters);
    expectInvalidScope(() => getScopedKvsTranslatorOrThrow(qpqConfig, 'scopedStringStore', 'ten@nt'), InvalidScopeErrorCode.unsafeCharacters);
    expectInvalidScope(() => getScopedKvsTranslatorOrThrow(qpqConfig, 'scopedNumberStore', 'scope-a'), InvalidScopeErrorCode.unsafeCharacters);
    expect(() => getScopedKvsTranslatorOrThrow(qpqConfig, 'missingStore', 'scope-a')).toThrow(KvsStoreNotFoundError);
  });

  it("enforces the store's scoped flag in both directions", () => {
    expectInvalidScope(() => getScopedKvsTranslatorOrThrow(qpqConfig, 'stringStore', 'TENANT#a'), InvalidScopeErrorCode.notScoped);
    expectInvalidScope(() => getScopedKvsTranslatorOrThrow(qpqConfig, 'scopedStringStore', undefined), InvalidScopeErrorCode.scopeRequired);
  });
});
