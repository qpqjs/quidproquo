import { Effect } from 'quidproquo-core';

import { EventDocEffect, EventDocPublishData } from '../models';

/** Reserved effect: publishes the current draft. */
export type EventDocPublishEffect = Effect<EventDocEffect.Publish, EventDocPublishData>;
