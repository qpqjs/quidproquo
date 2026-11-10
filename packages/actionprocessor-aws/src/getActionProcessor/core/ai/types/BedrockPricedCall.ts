import { AiCacheTtl, AiDataRegion, AiModel } from '@qpqjs/core';

/** What a call's price depends on: the model, the region its profile runs in, and the cache lifetime asked for. */
export type BedrockPricedCall = {
  model: AiModel;
  region: AiDataRegion;
  cacheTtl?: AiCacheTtl;
};
