import { AskResponse, askStateDispatchEffect, StoryResultMetadata } from 'quidproquo-core';

import { VolatileEffect } from '../../effects/volatile/VolatileEffect';
import { VolatileLogSearchPartLoadedEffect } from '../../effects/volatile/VolatileLogSearchPartLoadedEffect';

export function* askUIVolatileLogSearchPartLoaded(searchKey: string, logs: StoryResultMetadata[]): AskResponse<void> {
  yield* askStateDispatchEffect<VolatileLogSearchPartLoadedEffect>(VolatileEffect.logSearchPartLoaded, { searchKey, logs });
}
