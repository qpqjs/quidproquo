import { AiDataRegion } from 'quidproquo-core';

// The region every Bedrock request is resolved through. Fixed until a deploy setting or a user's
// choice picks one; a model with no id for this region is unsupported rather than routed elsewhere.
export const bedrockDataRegion = AiDataRegion.Australia;
