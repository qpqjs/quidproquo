import { Effect } from 'quidproquo-core';

import { EventDocEffect } from '../models';

/** Reserved effect: soft-deletes the document. deletedAt/deletedBy come from the event metadata. */
export type EventDocDeleteEffect = Effect<EventDocEffect.Delete, void>;
