import { Effect } from '@qpqjs/core';

import { VolatileEffect } from './VolatileEffect';
import { VolatileSearchStartedPayload } from './VolatileSearchStartedPayload';

export type VolatileLogSearchStartedEffect = Effect<VolatileEffect.logSearchStarted, VolatileSearchStartedPayload>;
