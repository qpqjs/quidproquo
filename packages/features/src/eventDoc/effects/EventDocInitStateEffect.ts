import { Effect } from 'quidproquo-core';

import { EventDocEffect, EventDocInitData } from '../models';

/** Reserved effect: the opening event of every log (id 0), seeded at create with the doc's identity. */
export type EventDocInitStateEffect = Effect<EventDocEffect.InitState, EventDocInitData>;
