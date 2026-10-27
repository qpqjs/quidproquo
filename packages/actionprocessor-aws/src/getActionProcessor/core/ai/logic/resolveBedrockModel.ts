import { AiDataRegion, AiModel, Nullable } from 'quidproquo-core';

import { bedrockModelMap } from '../aiModelMap';
import { bedrockDataRegionPreference } from '../bedrockDataRegionPreference';
import { BedrockResolvedModel } from '../types';

/**
 * Picks the inference profile a model runs under: the first preferred region it is offered in,
 * else the first region it lists at all. Null for a model offered nowhere.
 */
export const resolveBedrockModel = (model: AiModel): Nullable<BedrockResolvedModel> => {
  const regions = bedrockModelMap[model] ?? {};
  const listed = Object.keys(regions) as AiDataRegion[];
  const region = bedrockDataRegionPreference.find((preferred) => regions[preferred]) ?? listed[0];
  const modelId = region ? regions[region] : undefined;

  return region && modelId ? { modelId, region } : null;
};
