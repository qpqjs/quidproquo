import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askNewSortableGuids } from './askNewSortableGuids';
import { GuidActionType } from './GuidActionType';

describe('askNewSortableGuids', () => {
  it('yields a NewSortableMany action carrying its arguments', () => {
    const { action } = captureRequester(askNewSortableGuids(3));

    expect(action).toEqual({ type: GuidActionType.NewSortableMany, payload: { count: 3 } });
  });

  it('returns the value the runtime resolves', () => {
    const { returned } = captureRequester(askNewSortableGuids(3), ['a', 'b', 'c']);

    expect(returned).toEqual(['a', 'b', 'c']);
  });
});
