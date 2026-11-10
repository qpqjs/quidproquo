import { AiStreamUsage, getAiUsageAmountMicroUsd } from '@qpqjs/core';

import { BedrockPricedCall } from '../types';
import { bedrockModelPriceMap } from './bedrockModelPriceMap';
import { toBedrockCacheWriteTtl } from './toBedrockCacheWriteTtl';

/** The usage with what it cost at Bedrock's list price for the model and region it ran in; unchanged when that has no price. */
export const priceBedrockUsage = (usage: AiStreamUsage, call: BedrockPricedCall): AiStreamUsage => {
  const rates = bedrockModelPriceMap[call.model]?.[call.region];

  if (!rates) {
    return usage;
  }

  return { ...usage, costMicroUsd: getAiUsageAmountMicroUsd(usage, rates, toBedrockCacheWriteTtl(call.model, call.cacheTtl)) };
};
