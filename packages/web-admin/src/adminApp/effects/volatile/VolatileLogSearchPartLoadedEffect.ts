import { Effect, StoryResultMetadata } from '@qpqjs/core';

import { VolatileEffect } from './VolatileEffect';

export type VolatileLogSearchPartLoadedPayload = {
  searchKey: string;
  logs: StoryResultMetadata[];
};

export type VolatileLogSearchPartLoadedEffect = Effect<VolatileEffect.logSearchPartLoaded, VolatileLogSearchPartLoadedPayload>;
