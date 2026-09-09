import { AskResponse, askStateDispatchEffect } from 'quidproquo-core';

import { EventDocSummary } from '../../models';
import type { EventDocListAddItemEffect } from '../effects/EventDocListAddItemEffect';
import { EventDocListEffect } from '../effects/EventDocListEffect';

/** Dispatches AddItem. */
export function* askUIEventDocListAddItem(item: EventDocSummary): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocListAddItemEffect>(EventDocListEffect.AddItem, { item });
}
