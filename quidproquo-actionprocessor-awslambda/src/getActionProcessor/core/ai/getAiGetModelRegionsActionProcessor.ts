import {
  ActionProcessorList,
  ActionProcessorListResolver,
  actionResult,
  AiActionType,
  AiDataRegion,
  AiModel,
  AiModelRegionMap,
  askAiGetModelRegions,
  ProcessorFor,
} from 'quidproquo-core';

import { bedrockModelMap } from './aiModelMap';

const processAiGetModelRegions: ProcessorFor<typeof askAiGetModelRegions> = async () => {
  // Filled by walking every enum member, which is what makes the seed cast honest.
  const regions = {} as AiModelRegionMap;
  for (const model of Object.values(AiModel)) {
    regions[model] = Object.keys(bedrockModelMap[model]) as AiDataRegion[];
  }

  return actionResult(regions);
};

export const getAiGetModelRegionsActionProcessor: ActionProcessorListResolver = async (): Promise<ActionProcessorList> => ({
  [AiActionType.GetModelRegions]: processAiGetModelRegions,
});
