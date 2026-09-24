import { defineQueue, QPQConfig } from 'quidproquo';
import { defineEventDoc } from 'quidproquo-features';

import {
  SMOKE_EVENT_DOC_APPEND_MESSAGE_TYPE,
  SMOKE_EVENT_DOC_APPEND_QUEUE,
  SMOKE_EVENT_DOC_BASE_PATH,
} from '../constants/smokeEventDoc';
import { smokeProbeDocDefinition } from '../definition/smokeProbeDocDefinition';

/**
 * A full registered event-doc collection (stores, stream projector, dynamic
 * functions, routes) so the tests exercise event docs the way a real service
 * does, plus the queue that fans a test's writers out one invocation each so
 * their appends race across lambdas.
 */
export const defineEventDocSmoke = (): QPQConfig => [
  // NOTE the routes mount with no auth (the test service has no user
  // directory), so the collection is world-writable; it holds nothing but
  // throwaway probe docs.
  defineEventDoc(
    smokeProbeDocDefinition,
    {
      basePath: __dirname,
      relativePath: '../definition/smokeProbeDocDefinition',
      functionName: 'smokeProbeDocDefinition',
    },
    { basePath: SMOKE_EVENT_DOC_BASE_PATH }
  ),
  // A writer that loses the slot race past the append retry cap fails its
  // message; a quick redelivery lets it land instead of vanishing, as a
  // production queue should.
  defineQueue(
    SMOKE_EVENT_DOC_APPEND_QUEUE,
    {
      [SMOKE_EVENT_DOC_APPEND_MESSAGE_TYPE]: {
        basePath: __dirname,
        relativePath: '../entry/queue/onSmokeEventDocAppend',
        functionName: 'onSmokeEventDocAppend',
      },
    },
    { maxTries: 3, ttRetryInSeconds: 10 }
  ),
];
