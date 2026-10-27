import { KvsQueryOperationType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { buildKvsScopeBeginsWithCondition, composeScopedKvsValue, decomposeScopedKvsValue, stripScopedKvsValue } from './scopedKvsValue';

describe('composeScopedKvsValue / stripScopedKvsValue', () => {
  it('round-trips a scoped string value', () => {
    const stored = composeScopedKvsValue('scope-a', 'item-1');
    expect(stored).toBe('scope-a@@QPQSCOPE@@item-1');
    expect(stripScopedKvsValue('scope-a', stored)).toBe('item-1');
  });

  // '::' is qpq's function-runtime separator and lives inside correlation ids,
  // which the log service stores as partition keys - it must round-trip fine.
  it('round-trips a value containing "::"', () => {
    const stored = composeScopedKvsValue('scope-a', 'onCreate::onCreate');
    expect(stored).toBe('scope-a@@QPQSCOPE@@onCreate::onCreate');
    expect(stripScopedKvsValue('scope-a', stored)).toBe('onCreate::onCreate');
  });

  it('leaves an unscoped stored value unchanged when stripping', () => {
    expect(stripScopedKvsValue('scope-a', 'item-1')).toBe('item-1');
    expect(stripScopedKvsValue('scope-a', 7)).toBe(7);
  });
});

describe('decomposeScopedKvsValue', () => {
  it('splits a composed value into its scope and raw key', () => {
    expect(decomposeScopedKvsValue('scope-a@@QPQSCOPE@@item-1')).toEqual({ scope: 'scope-a', rawValue: 'item-1' });
  });

  it('reports no scope for an unscoped value', () => {
    expect(decomposeScopedKvsValue('item-1')).toEqual({ rawValue: 'item-1' });
  });
});

describe('buildKvsScopeBeginsWithCondition', () => {
  it('builds a begins-with predicate on the pk attribute', () => {
    expect(buildKvsScopeBeginsWithCondition('id', 'scope-a')).toEqual({
      key: 'id',
      operation: KvsQueryOperationType.BeginsWith,
      valueA: 'scope-a@@QPQSCOPE@@',
    });
  });
});
