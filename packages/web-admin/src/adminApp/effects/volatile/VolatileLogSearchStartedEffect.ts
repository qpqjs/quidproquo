import { Effect } from 'quidproquo-core';

import { VolatileEffect } from './VolatileEffect';
import { VolatileSearchStartedPayload } from './VolatileSearchStartedPayload';

export type VolatileLogSearchStartedEffect = Effect<VolatileEffect.logSearchStarted, VolatileSearchStartedPayload>;
