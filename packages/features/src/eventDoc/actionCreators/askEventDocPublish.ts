import { AskResponse } from '@qpqjs/core';

import { askApplyEventDocEvent } from '../actions/askApplyEventDocEvent';
import { EventDocPublishEffect } from '../effects/EventDocPublishEffect';
import { EventDocEffect, EventDocPublishData } from '../models';

/** Applies the reserved Publish effect to the bound doc. */
export function* askEventDocPublish(data: EventDocPublishData): AskResponse<void> {
  yield* askApplyEventDocEvent<EventDocPublishEffect>(EventDocEffect.Publish, data);
}
