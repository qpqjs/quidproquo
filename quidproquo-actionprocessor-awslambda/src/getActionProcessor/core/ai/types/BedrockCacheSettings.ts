import { AiCacheTtl, AiModel } from 'quidproquo-core';

/** What a Bedrock cache point depends on: the model decides which lifetimes it accepts. */
export type BedrockCacheSettings = {
  model: AiModel;
  cacheTtl?: AiCacheTtl;
};
