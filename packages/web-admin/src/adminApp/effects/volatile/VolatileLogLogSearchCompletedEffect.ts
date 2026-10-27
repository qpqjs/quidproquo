import { Effect } from 'quidproquo-core';

import { VolatileEffect } from './VolatileEffect';
import { VolatileSearchCompletedPayload } from './VolatileSearchCompletedPayload';

export type VolatileLogLogSearchCompletedEffect = Effect<VolatileEffect.logLogSearchCompleted, VolatileSearchCompletedPayload>;
