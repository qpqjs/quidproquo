import { captureRequester, runStory, StoryError, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askGuidNewSortable } from './askGuidNewSortable';
import { GuidActionType } from './GuidActionType';

describe('askGuidNewSortable', () => {
  it('yields a NewSortable action', () => {
    const { action } = captureRequester(askGuidNewSortable());

    expect(action).toEqual({ type: GuidActionType.NewSortable });
  });

  it('returns the sortable guid the runtime resolves', () => {
    const { returned } = captureRequester(askGuidNewSortable(), '01-sortable');

    expect(returned).toBe('01-sortable');
  });

  it('propagates a guid generation failure as a thrown error', () => {
    const run = () =>
      runStory(askGuidNewSortable(), {
        [GuidActionType.NewSortable]: throwsError('GenericError', 'guid service down'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('guid service down');
  });
});
