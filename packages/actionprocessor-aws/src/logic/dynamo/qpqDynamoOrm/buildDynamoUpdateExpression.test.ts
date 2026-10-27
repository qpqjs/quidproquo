import { KvsUpdate, KvsUpdateActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { buildDynamoUpdateExpression } from './buildDynamoUpdateExpression';
import { getItemName } from './getItemName';
import { getValueName } from './getValueName';

describe('buildDynamoUpdateExpression', () => {
  it('builds a SET clause for Set actions', () => {
    const updates: KvsUpdate = [{ attributePath: 'name', action: KvsUpdateActionType.Set, value: 'Ada' }];

    expect(buildDynamoUpdateExpression(updates)).toBe(`SET ${getItemName('name')} = ${getValueName('Ada')}`);
  });

  it('builds a SET clause with if_not_exists for SetIfNotExists', () => {
    const updates: KvsUpdate = [{ attributePath: 'name', action: KvsUpdateActionType.SetIfNotExists, value: 'Ada' }];
    const name = getItemName('name');

    expect(buildDynamoUpdateExpression(updates)).toBe(`SET ${name} = if_not_exists(${name}, ${getValueName('Ada')})`);
  });

  it('builds an Increment as if_not_exists plus the increment value', () => {
    const updates: KvsUpdate = [{ attributePath: 'count', action: KvsUpdateActionType.Increment, value: 1, defaultValue: 0 }];
    const count = getItemName('count');

    expect(buildDynamoUpdateExpression(updates)).toBe(`SET ${count} = if_not_exists(${count}, ${getValueName(0)}) + ${getValueName(1)}`);
  });

  it('builds REMOVE, ADD and DELETE clauses', () => {
    expect(buildDynamoUpdateExpression([{ attributePath: 'old', action: KvsUpdateActionType.Remove }])).toBe(`REMOVE ${getItemName('old')}`);
    expect(buildDynamoUpdateExpression([{ attributePath: 'tags', action: KvsUpdateActionType.Add, value: 'x' }])).toBe(
      `ADD ${getItemName('tags')} ${getValueName('x')}`,
    );
    expect(buildDynamoUpdateExpression([{ attributePath: 'tags', action: KvsUpdateActionType.Delete, value: 'x' }])).toBe(
      `DELETE ${getItemName('tags')} ${getValueName('x')}`,
    );
  });

  it('resolves a nested attribute path with array indexes', () => {
    const updates: KvsUpdate = [{ attributePath: ['items', 0], action: KvsUpdateActionType.Set, value: 'x' }];

    expect(buildDynamoUpdateExpression(updates)).toBe(`SET ${getItemName('items')}[0] = ${getValueName('x')}`);
  });

  it('rejects attribute path segments that are not strings or non-negative integers', () => {
    expect(() => buildDynamoUpdateExpression([{ attributePath: ['items', 1.5], action: KvsUpdateActionType.Set, value: 'x' }])).toThrow(
      'Invalid attribute path segment',
    );

    // A non-string, non-number segment smuggled through JSON must never be
    // stringified into the expression (that would be expression injection).
    const smuggled = ['items', { toString: () => '0] , #a = :b' }] as unknown as KvsUpdate[number]['attributePath'];
    expect(() => buildDynamoUpdateExpression([{ attributePath: smuggled, action: KvsUpdateActionType.Set, value: 'x' }])).toThrow(
      'Invalid attribute path segment',
    );
  });

  it('combines clauses across action types', () => {
    const updates: KvsUpdate = [
      { attributePath: 'name', action: KvsUpdateActionType.Set, value: 'Ada' },
      { attributePath: 'old', action: KvsUpdateActionType.Remove },
    ];

    expect(buildDynamoUpdateExpression(updates)).toBe(`SET ${getItemName('name')} = ${getValueName('Ada')} REMOVE ${getItemName('old')}`);
  });

  it('throws when a Set action has no value', () => {
    expect(() => buildDynamoUpdateExpression([{ attributePath: 'name', action: KvsUpdateActionType.Set }])).toThrow(
      "Value must be provided for 'SET' action",
    );
  });

  it('throws when an Increment action has no default value', () => {
    expect(() => buildDynamoUpdateExpression([{ attributePath: 'count', action: KvsUpdateActionType.Increment, value: 1 }])).toThrow(
      "Default value must be provided for 'Increment' action",
    );
  });
});
