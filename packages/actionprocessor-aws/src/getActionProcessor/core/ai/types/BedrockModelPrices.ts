import { AiDataRegion, AiTokenRates } from '@qpqjs/core';

/** A model's Bedrock list price in each region it is offered in, since the profile it runs under sets the price. */
export type BedrockModelPrices = Partial<Record<AiDataRegion, AiTokenRates>>;
