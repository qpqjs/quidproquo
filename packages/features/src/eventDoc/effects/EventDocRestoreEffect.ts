import { Effect } from 'quidproquo-core';

import { EventDocEffect } from '../models';

/** Reserved effect: undoes a soft delete. */
export type EventDocRestoreEffect = Effect<EventDocEffect.Restore, void>;
