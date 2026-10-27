import { KvsUpdate, KvsUpdateActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { buildUpdateExpressionAttributeNames } from './buildUpdateExpressionAttributeNames';
import { getItemName } from './getItemName';

describe('buildUpdateExpressionAttributeNames', () => {
  it('maps a top-level attribute placeholder to its name', () => {
    expect(buildUpdateExpressionAttributeNames([{ attributePath: 'name', action: KvsUpdateActionType.Set, value: 'x' }])).toEqual({
      [getItemName('name')]: 'name',
    });
  });

  it('maps each segment of a nested attribute path', () => {
    expect(buildUpdateExpressionAttributeNames([{ attributePath: ['a', 'b'], action: KvsUpdateActionType.Set, value: 'x' }])).toEqual({
      [getItemName('a')]: 'a',
      [getItemName('b')]: 'b',
    });
  });

  it('does not mutate the updates it is given', () => {
    const updates: KvsUpdate = [
      { attributePath: 'name', action: KvsUpdateActionType.Set, value: 'x' },
      { attributePath: ['a', 0, 'b'], action: KvsUpdateActionType.Set, value: 'y' },
    ];

    buildUpdateExpressionAttributeNames(updates);

    expect(updates[0].attributePath).toBe('name');
    expect(updates[1].attributePath).toEqual(['a', 0, 'b']);
  });
});
