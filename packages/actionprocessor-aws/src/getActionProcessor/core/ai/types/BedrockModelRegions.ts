import { AiDataRegion } from '@qpqjs/core';

/** The Bedrock inference profile id a model runs under in each region it is offered in. */
export type BedrockModelRegions = Partial<Record<AiDataRegion, string>>;
