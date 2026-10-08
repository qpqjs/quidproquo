import { AiDataRegion } from 'quidproquo-core';

// The order a model's regions are tried in when a request is resolved. Fixed for now; a deploy
// setting or the user's choice will drive it later.
export const bedrockDataRegionPreference: readonly AiDataRegion[] = [AiDataRegion.Australia, AiDataRegion.Global];
