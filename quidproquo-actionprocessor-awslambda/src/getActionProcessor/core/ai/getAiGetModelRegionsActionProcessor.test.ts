import { AiActionType, AiDataRegion, AiModel } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getAiGetModelRegionsActionProcessor } from './getAiGetModelRegionsActionProcessor';

describe('getAiGetModelRegionsActionProcessor', () => {
  it('returns the regions every AiModel is offered in', async () => {
    const processor = (await getAiGetModelRegionsActionProcessor({} as never, null as never))[AiActionType.GetModelRegions];

    const [result, error] = await invokeProcessor<Record<AiModel, AiDataRegion[]>>(processor, undefined);

    expect(error).toBeUndefined();
    expect(Object.keys(result!).sort()).toEqual(Object.values(AiModel).sort());
    expect(result![AiModel.ClaudeOpus55]).toEqual([AiDataRegion.Australia]);
  });
});
