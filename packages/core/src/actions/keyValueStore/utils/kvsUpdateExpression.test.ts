import { describe, expect, it } from 'vitest';

import { KvsUpdateActionType } from '../types';
import { kvsAdd, kvsDecrement, kvsDelete, kvsIncrement, kvsRemove, kvsSet, kvsSetIfNotExists, kvsUpdate } from './kvsUpdateExpression';

describe('kvsUpdateExpression', () => {
  it('builds a Set action carrying the path and value', () => {
    expect(kvsSet('name', 'Alice')).toEqual({
      attributePath: 'name',
      action: KvsUpdateActionType.Set,
      value: 'Alice',
    });
  });

  it('builds a Remove action with no value', () => {
    expect(kvsRemove('name')).toEqual({
      attributePath: 'name',
      action: KvsUpdateActionType.Remove,
    });
  });

  it('builds an Add action', () => {
    expect(kvsAdd('tags', ['a'])).toEqual({
      attributePath: 'tags',
      action: KvsUpdateActionType.Add,
      value: ['a'],
    });
  });

  it('builds a Delete action', () => {
    expect(kvsDelete('tags', ['a'])).toEqual({
      attributePath: 'tags',
      action: KvsUpdateActionType.Delete,
      value: ['a'],
    });
  });

  it('builds a SetIfNotExists action', () => {
    expect(kvsSetIfNotExists('firstSeen', 123)).toEqual({
      attributePath: 'firstSeen',
      action: KvsUpdateActionType.SetIfNotExists,
      value: 123,
    });
  });

  it('builds an Increment action defaulting the initial value to 0', () => {
    expect(kvsIncrement('count', 5)).toEqual({
      attributePath: 'count',
      action: KvsUpdateActionType.Increment,
      value: 5,
      defaultValue: 0,
    });
  });

  it('honours an explicit default value on increment', () => {
    expect(kvsIncrement('count', 5, 10)).toEqual({
      attributePath: 'count',
      action: KvsUpdateActionType.Increment,
      value: 5,
      defaultValue: 10,
    });
  });

  it('models decrement as a negative Increment', () => {
    expect(kvsDecrement('count', 3)).toEqual({
      attributePath: 'count',
      action: KvsUpdateActionType.Increment,
      value: -3,
      defaultValue: 0,
    });
  });

  it('honours an explicit default value on decrement', () => {
    expect(kvsDecrement('count', 3, 100).defaultValue).toBe(100);
  });

  it('returns the action list unchanged', () => {
    const actions = [kvsSet('a', 1), kvsRemove('b')];

    expect(kvsUpdate(actions)).toBe(actions);
  });
});
