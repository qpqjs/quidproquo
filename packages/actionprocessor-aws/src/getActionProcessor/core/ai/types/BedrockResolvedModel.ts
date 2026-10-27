import { AiDataRegion } from '@qpqjs/core';

/** The inference profile a request will run under, and the region that choice lands it in. */
export type BedrockResolvedModel = {
  modelId: string;
  region: AiDataRegion;
};
