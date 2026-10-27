import { describe, expect, it } from 'vitest';

import { captureRequester, runStory, StoryError, throwsError } from '../../testing';
import { AiActionType } from './AiActionType';
import { AiDataRegion } from './AiDataRegion';
import { AiModel } from './AiModel';
import { askAiGetModelRegions } from './askAiGetModelRegions';

describe('askAiGetModelRegions', () => {
  it('yields a GetModelRegions action with no payload', () => {
    const { action } = captureRequester(askAiGetModelRegions());

    expect(action).toEqual({ type: AiActionType.GetModelRegions });
  });

  it('returns the region map the platform resolves', () => {
    const regions = { [AiModel.ClaudeOpus55]: [AiDataRegion.Australia] };
    const { returned } = captureRequester(askAiGetModelRegions(), regions);

    expect(returned).toBe(regions);
  });

  it('propagates a lookup failure as a thrown error', () => {
    const run = () =>
      runStory(askAiGetModelRegions(), {
        [AiActionType.GetModelRegions]: throwsError('NotImplemented', 'no ai processor'),
      });

    expect(run).toThrow(StoryError);
    expect(run).toThrow('no ai processor');
  });
});
