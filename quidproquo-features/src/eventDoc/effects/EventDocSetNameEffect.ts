import { Effect } from 'quidproquo-core';

import { EventDocEffect, EventDocSetNameData } from '../models';

/** Reserved effect: sets the document name. */
export type EventDocSetNameEffect = Effect<EventDocEffect.SetName, EventDocSetNameData>;
