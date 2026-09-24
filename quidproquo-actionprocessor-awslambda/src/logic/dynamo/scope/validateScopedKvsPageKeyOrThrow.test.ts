import { InvalidScopeError, InvalidScopeErrorCode } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { lastEvaluatedKeyToString } from '../utils/lastEvaluatedKeyToString';
import { validateScopedKvsPageKeyOrThrow } from './validateScopedKvsPageKeyOrThrow';

const expectOutOfScope = (fn: () => unknown) => {
  try {
    fn();
    expect.unreachable('expected InvalidScopeError');
  } catch (error) {
    expect(error).toBeInstanceOf(InvalidScopeError);
    expect((error as InvalidScopeError).code).toBe(InvalidScopeErrorCode.pageKeyOutOfScope);
  }
};

describe('validateScopedKvsPageKeyOrThrow', () => {
  it("accepts the scope's own table and index page keys", () => {
    const tableKey = lastEvaluatedKeyToString({ id: { S: 'acme@@QPQSCOPE@@o-1' }, createdAt: { S: '2026-09-24' } });
    const indexKey = lastEvaluatedKeyToString({
      id: { S: 'acme@@QPQSCOPE@@o-1' },
      '@@QPQGSI_customerId@@': { S: 'acme@@QPQSCOPE@@c-9' },
    });

    expect(() => validateScopedKvsPageKeyOrThrow('acme', tableKey, 'id')).not.toThrow();
    expect(() => validateScopedKvsPageKeyOrThrow('acme', indexKey, 'id')).not.toThrow();
  });

  it('refuses a page key whose pk belongs to another scope', () => {
    const otherScopeKey = lastEvaluatedKeyToString({ id: { S: 'bobco@@QPQSCOPE@@o-1' } });

    expectOutOfScope(() => validateScopedKvsPageKeyOrThrow('acme', otherScopeKey, 'id'));
  });

  it("refuses a page key whose hidden index copy belongs to another scope, even with the caller's pk", () => {
    const mixedKey = lastEvaluatedKeyToString({
      id: { S: 'acme@@QPQSCOPE@@o-1' },
      '@@QPQGSI_customerId@@': { S: 'bobco@@QPQSCOPE@@c-9' },
    });

    expectOutOfScope(() => validateScopedKvsPageKeyOrThrow('acme', mixedKey, 'id'));
  });

  it('refuses a page key with no scoped pk, or a scope that only shares a prefix', () => {
    expectOutOfScope(() => validateScopedKvsPageKeyOrThrow('acme', lastEvaluatedKeyToString({ other: { S: 'x' } }), 'id'));
    expectOutOfScope(() => validateScopedKvsPageKeyOrThrow('acme', lastEvaluatedKeyToString({ id: { S: 'o-1' } }), 'id'));
    expectOutOfScope(() => validateScopedKvsPageKeyOrThrow('acme', lastEvaluatedKeyToString({ id: { S: 'acme-2@@QPQSCOPE@@o-1' } }), 'id'));
    expectOutOfScope(() => validateScopedKvsPageKeyOrThrow('acme', Buffer.from('5').toString('base64'), 'id'));
  });
});
