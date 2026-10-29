import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askGuidNewSortableMany } from './askGuidNewSortableMany';
import { GuidActionType } from './GuidActionType';

describe('askGuidNewSortableMany', () => {
  it('yields a NewSortableMany action carrying its arguments', () => {
    const { action } = captureRequester(askGuidNewSortableMany(3));

    expect(action).toEqual({ type: GuidActionType.NewSortableMany, payload: { count: 3 } });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askGuidNewSortableMany(3), ['a', 'b', 'c']);

    expect(returned).toEqual(['a', 'b', 'c']);
  });
});
