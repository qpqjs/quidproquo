import { Effect } from 'quidproquo-core';

import { VolatileEffect } from './VolatileEffect';
import { VolatileSearchCompletedPayload } from './VolatileSearchCompletedPayload';

export type VolatileLogSearchCompletedEffect = Effect<VolatileEffect.logSearchCompleted, VolatileSearchCompletedPayload>;
