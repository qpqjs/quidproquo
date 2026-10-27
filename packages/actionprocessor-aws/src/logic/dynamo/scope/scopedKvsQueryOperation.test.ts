import { KvsLogicalOperatorType, KvsQueryOperationType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { composeScopedKvsQueryOperation, stripScopedKvsItem } from './scopedKvsQueryOperation';

describe('composeScopedKvsQueryOperation', () => {
  it('rewrites both bounds of a Between condition on the partition key', () => {
    expect(
      composeScopedKvsQueryOperation('scope-a', { key: 'id', operation: KvsQueryOperationType.Between, valueA: 'a', valueB: 'z' }, 'id'),
    ).toEqual({
      key: 'id',
      operation: KvsQueryOperationType.Between,
      valueA: 'scope-a@@QPQSCOPE@@a',
      valueB: 'scope-a@@QPQSCOPE@@z',
    });
  });

  it('rewrites each entry of an In list and leaves non-pk conditions alone', () => {
    const operation = {
      operation: KvsLogicalOperatorType.And,
      conditions: [
        { key: 'id', operation: KvsQueryOperationType.In, valueA: ['a', 'b'] },
        { key: 'status', operation: KvsQueryOperationType.Equal, valueA: 'active' },
      ],
    };

    expect(composeScopedKvsQueryOperation('scope-a', operation, 'id')).toEqual({
      operation: KvsLogicalOperatorType.And,
      conditions: [
        { key: 'id', operation: KvsQueryOperationType.In, valueA: ['scope-a@@QPQSCOPE@@a', 'scope-a@@QPQSCOPE@@b'] },
        { key: 'status', operation: KvsQueryOperationType.Equal, valueA: 'active' },
      ],
    });
  });
});

describe('stripScopedKvsItem', () => {
  it('clones the item with the scope prefix stripped off its pk attribute', () => {
    const stored = { id: 'scope-a@@QPQSCOPE@@item-1', name: 'n' };

    const stripped = stripScopedKvsItem('scope-a', stored, 'id');

    expect(stripped).toEqual({ id: 'item-1', name: 'n' });
    expect(stored).toEqual({ id: 'scope-a@@QPQSCOPE@@item-1', name: 'n' });
  });

  it('returns the same item when the pk carries no prefix', () => {
    const stored = { id: 'item-1', name: 'n' };

    expect(stripScopedKvsItem('scope-a', stored, 'id')).toBe(stored);
  });
});
