import { AiCacheTtl, AiModel } from '@qpqjs/core';

import { bedrockOneHourCacheModels } from './bedrockOneHourCacheModels';

type BedrockCacheWriteTtl = AiCacheTtl.FiveMinutes | AiCacheTtl.OneHour;

/**
 * Which cache write price a call is charged at, following the points `toBedrockCachePoint` sets:
 * five minutes when every point lived five minutes, else the hour, since Bedrock reports all of a
 * call's writes as one number and an hour point makes some of them the dearer kind. Exhaustive
 * over `AiCacheTtl`, like the cache points.
 */
export const toBedrockCacheWriteTtl = (model: AiModel, cacheTtl: AiCacheTtl = AiCacheTtl.Dynamic): BedrockCacheWriteTtl => {
  // A model that cannot cache for an hour is only ever given five minute points.
  if (!bedrockOneHourCacheModels.has(model)) {
    return AiCacheTtl.FiveMinutes;
  }

  switch (cacheTtl) {
    case AiCacheTtl.Dynamic:
    case AiCacheTtl.OneHour:
      return AiCacheTtl.OneHour;

    case AiCacheTtl.FiveMinutes:
    case AiCacheTtl.ProviderDefault:
      return AiCacheTtl.FiveMinutes;
  }
};
