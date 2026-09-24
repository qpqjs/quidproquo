import { defineEventBus, defineQueue, QPQConfig } from 'quidproquo';

import { SMOKE_PROBE_EVENT_BUS } from '../constants/SMOKE_PROBE_EVENT_BUS';
import { SMOKE_PROBE_EVENT_QUEUE } from '../constants/SMOKE_PROBE_EVENT_QUEUE';
import { SMOKE_PROBE_EVENT_TYPE } from '../constants/SMOKE_PROBE_EVENT_TYPE';

/** Publish to the bus, the subscribed queue's entry writes a marker into the probe store, the test polls for it. */
export const defineEventBusSmoke = (): QPQConfig => [
  defineEventBus(SMOKE_PROBE_EVENT_BUS),
  defineQueue(
    SMOKE_PROBE_EVENT_QUEUE,
    {
      [SMOKE_PROBE_EVENT_TYPE]: {
        basePath: __dirname,
        relativePath: '../entry/queue/onSmokeProbeEvent',
        functionName: 'onSmokeProbeEvent',
      },
    },
    { eventBusSubscriptions: [SMOKE_PROBE_EVENT_BUS] }
  ),
];
