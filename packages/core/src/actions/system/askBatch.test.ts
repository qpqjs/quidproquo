import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { askBatch } from './askBatch';
import { SystemActionType } from './SystemActionType';

describe('askBatch', () => {
  it('batches multiple actions into a single Batch action', () => {
    const actions = [
      { type: 'a', payload: 1 },
      { type: 'b', payload: 2 },
    ];

    const { action, returned } = captureRequester(askBatch(actions), ['ra', 'rb']);

    expect(action).toEqual({ type: SystemActionType.Batch, payload: { actions } });
    expect(returned).toEqual(['ra', 'rb']);
  });

  it('yields the single action directly when only one is given', () => {
    const inner = { type: 'a', payload: 1 };

    const { action } = captureRequester(askBatch([inner]), 'ra');

    expect(action).toEqual(inner);
  });

  it('wraps the single-action result in an array', () => {
    const { returned } = captureRequester(askBatch([{ type: 'a', payload: 1 }]), 'ra');

    expect(returned).toEqual(['ra']);
  });

  it('resolves an empty batch to an empty result array', () => {
    const result = runStory(askBatch([]));

    expect(result).toEqual([]);
  });

  it('yields no action at all for an empty batch, so nothing hits the story log', () => {
    const step = askBatch([]).next();

    expect(step).toEqual({ done: true, value: [] });
  });

  it('propagates a failing batched action as a thrown error', () => {
    const run = () =>
      runStory(
        askBatch([
          { type: 'a', payload: 1 },
          { type: 'b', payload: 2 },
        ]),
        {
          a: 'ra',
          b: throwsError('GenericError', 'b failed'),
        },
      );

    expect(run).toThrow(StoryError);
    expect(run).toThrow('b failed');
  });
});
