import { Effect } from 'quidproquo-core';

import { VolatileEffect } from './VolatileEffect';
import { VolatileSearchStartedPayload } from './VolatileSearchStartedPayload';

export type VolatileLogLogSearchStartedEffect = Effect<VolatileEffect.logLogSearchStarted, VolatileSearchStartedPayload>;
