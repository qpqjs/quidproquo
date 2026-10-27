import { QpqRuntimeType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { RuntimeTypes } from './RuntimeTypes';

describe('RuntimeTypes', () => {
  it('starts with the ALL sentinel', () => {
    expect(RuntimeTypes[0]).toBe('ALL');
  });

  it('includes every sorted runtime type after ALL', () => {
    expect(RuntimeTypes.slice(1)).toEqual(Object.keys(QpqRuntimeType).sort());
  });
});
