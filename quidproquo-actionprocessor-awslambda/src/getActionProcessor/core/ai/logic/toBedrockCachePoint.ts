import { AiCacheTtl } from 'quidproquo-core';

import { bedrockOneHourCacheModels } from '../bedrockOneHourCacheModels';
import { BedrockCacheSettings } from '../types';

export type BedrockCachePoint = { type: 'default' } | { type: 'default'; ttl: '1h' };

/**
 * The Bedrock cache checkpoint for a model and requested lifetime. Exhaustive over `AiCacheTtl`,
 * so a new member fails to compile here until this provider says what it does with it.
 */
export const toBedrockCachePoint = ({ model, cacheTtl = AiCacheTtl.ProviderDefault }: BedrockCacheSettings): BedrockCachePoint => {
  switch (cacheTtl) {
    // A model that cannot cache for an hour rejects the field, failing the whole request, so
    // it gets the default lifetime instead.
    case AiCacheTtl.OneHour:
      return bedrockOneHourCacheModels.has(model) ? { type: 'default', ttl: '1h' } : { type: 'default' };

    // Five minutes is what Bedrock does without the field, and models that support nothing
    // else reject the field outright, so an explicit five minutes omits it like the default.
    case AiCacheTtl.FiveMinutes:
    case AiCacheTtl.ProviderDefault:
      return { type: 'default' };
  }
};
