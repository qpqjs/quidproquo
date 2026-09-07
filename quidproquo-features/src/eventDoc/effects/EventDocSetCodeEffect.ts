import { Effect } from 'quidproquo-core';

import { EventDocEffect, EventDocSetCodeData } from '../models';

/** Reserved effect: sets the document code. */
export type EventDocSetCodeEffect = Effect<EventDocEffect.SetCode, EventDocSetCodeData>;
