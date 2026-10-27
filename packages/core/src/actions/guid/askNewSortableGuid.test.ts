import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askNewSortableGuid } from './askNewSortableGuid';
import { GuidActionType } from './GuidActionType';

describe('askNewSortableGuid', () => {
  it('yields a NewSortable action', () => {
    const { action } = captureRequester(askNewSortableGuid());

    expect(action).toEqual({ type: GuidActionType.NewSortable });
  });

  it('returns the sortable guid the runtime resolves', () => {
    const { returned } = captureRequester(askNewSortableGuid(), '01-sortable');

    expect(returned).toBe('01-sortable');
  });

  it('propagates a guid generation failure as a thrown error', () => {
    const run = () =>
      runStory(askNewSortableGuid(), {
        [GuidActionType.NewSortable]: throwsError('GenericError', 'guid service down'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('guid service down');
  });
});
