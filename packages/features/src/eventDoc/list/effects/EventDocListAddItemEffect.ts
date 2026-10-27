import { Effect } from 'quidproquo-core';

import { EventDocSummary } from '../../models';
import { EventDocListEffect } from './EventDocListEffect';

/** Payload of AddItem. */
export type EventDocListAddItemPayload = {
  item: EventDocSummary;
};

/** Prepends a newly created item. */
export type EventDocListAddItemEffect = Effect<EventDocListEffect.AddItem, EventDocListAddItemPayload>;
