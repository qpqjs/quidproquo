import { describe, expect, it } from 'vitest';

import { ContextActionType } from './ContextActionType';

describe('ContextActionType', () => {
  it('should have unique action type values', () => {
    const actionTypeValues = Object.values(ContextActionType);
    const uniqueValues = new Set(actionTypeValues);
    expect(uniqueValues.size).toBe(actionTypeValues.length);
  });

  it('should have the correct action type for Read', () => {
    expect(ContextActionType.Read).toBe('@quidproquo-core/Context/Read');
  });

  it('should have the correct action type for List', () => {
    expect(ContextActionType.List).toBe('@quidproquo-core/Context/List');
  });
});
