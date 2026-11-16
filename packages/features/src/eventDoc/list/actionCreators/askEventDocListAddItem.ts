import { AskResponse, askStateDispatchEffect } from '@qpqjs/core';

import type { EventDocListAddItemEffect } from '../effects/EventDocListAddItemEffect';
import { EventDocListEffect } from '../effects/EventDocListEffect';
import type { EventDocListRow } from '../types/EventDocListRow';

/** Dispatches AddItem: a row of the view the list reads (a just-created summary, on a summary list). */
export function* askEventDocListAddItem(item: EventDocListRow): AskResponse<void> {
  yield* askStateDispatchEffect<EventDocListAddItemEffect>(EventDocListEffect.AddItem, { item });
}
