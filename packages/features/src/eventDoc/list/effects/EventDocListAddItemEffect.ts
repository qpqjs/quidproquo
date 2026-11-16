import { Effect } from '@qpqjs/core';

import { EventDocListRow } from '../types/EventDocListRow';
import { EventDocListEffect } from './EventDocListEffect';

/** Payload of AddItem. */
export type EventDocListAddItemPayload = {
  item: EventDocListRow;
};

/** Prepends a newly created item. */
export type EventDocListAddItemEffect = Effect<EventDocListEffect.AddItem, EventDocListAddItemPayload>;
