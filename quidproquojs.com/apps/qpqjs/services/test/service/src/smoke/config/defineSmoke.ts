import {
  defineEventBus,
  defineKeyValueStore,
  defineParameter,
  defineQueue,
  defineRoute,
  defineSecret,
  defineStorageDrive,
  QPQConfig,
  QpqFunctionRuntime,
} from 'quidproquo';

import { SMOKE_PROBE_DRIVE, SMOKE_PROBE_STORE } from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';

import { SMOKE_RUNS_STORE } from '../constants/SMOKE_RUNS_STORE';
import {
  SMOKE_PROBE_EVENT_BUS,
  SMOKE_PROBE_EVENT_QUEUE,
  SMOKE_PROBE_EVENT_TYPE,
  SMOKE_PROBE_PARAMETER,
  SMOKE_PROBE_PARAMETER_VALUE,
  SMOKE_PROBE_SECRET,
} from '../constants/smokeProbe';
import {
  SMOKE_RUN_QUEUE,
  SMOKE_TEST_REQUESTED_MESSAGE_TYPE,
} from '../constants/smokeRunQueue';

// Everything the smoke feature needs: the run store, the queue runs execute
// on, and the two routes. Runtimes are located relative to this file, so the
// module can move as a unit.
//
// The routes look public (no user directory, no api keys) but carry a
// per-runtime action processor override that swaps the route auth decode for
// the GitHub OIDC validator - so ONLY a GitHub Actions run of our repo,
// holding an OIDC token with the qpq-smoke audience and matching pinned
// claims, gets past the preamble. Everything else 401s, tokenless included.
export const defineSmoke = (): QPQConfig => {
  const githubOidcAuth: QpqFunctionRuntime[] = [
    {
      basePath: __dirname,
      relativePath: '../processors/github/getGithubOidcAuthProcessors',
      functionName: 'getGithubOidcAuthProcessors',
    },
  ];

  return [
    // One record per run, keyed by runId; the queue workers each write their
    // own test's entry as it completes and the GET route polls it.
    defineKeyValueStore(SMOKE_RUNS_STORE, 'runId'),

    // One message per test per run. Not FIFO and no concurrency cap, so the
    // tests of a run fan out and execute in parallel.
    defineQueue(SMOKE_RUN_QUEUE, {
      [SMOKE_TEST_REQUESTED_MESSAGE_TYPE]: {
        basePath: __dirname,
        relativePath: '../queue/onSmokeTestRequested',
        functionName: 'onSmokeTestRequested',
      },
    }),

    // Throwaway probe resources, one per kind of owned resource the tag-based
    // IAM grants cover. The store's `category` index is what the KVS test
    // queries through, proving the `table/*/index/*` half of the grant.
    defineKeyValueStore<SmokeProbeRecord>(SMOKE_PROBE_STORE, 'probeId', [], {
      indexes: ['category'],
    }),
    defineParameter(SMOKE_PROBE_PARAMETER, {
      value: SMOKE_PROBE_PARAMETER_VALUE,
    }),
    defineSecret(SMOKE_PROBE_SECRET),
    defineStorageDrive(SMOKE_PROBE_DRIVE),

    // Event bus test path: publish to the bus, the subscribed queue's entry
    // writes a marker into the probe store, the test polls for it.
    defineEventBus(SMOKE_PROBE_EVENT_BUS),
    defineQueue(
      SMOKE_PROBE_EVENT_QUEUE,
      {
        [SMOKE_PROBE_EVENT_TYPE]: {
          basePath: __dirname,
          relativePath: '../queue/onSmokeProbeEvent',
          functionName: 'onSmokeProbeEvent',
        },
      },
      { eventBusSubscriptions: [SMOKE_PROBE_EVENT_BUS] }
    ),

    defineRoute('POST', '/smoke/run', {
      basePath: __dirname,
      relativePath: '../controller/askRunSmokeTests',
      functionName: 'askRunSmokeTests',
      actionProcessors: githubOidcAuth,
    }),

    defineRoute('GET', '/smoke/run/{runId}', {
      basePath: __dirname,
      relativePath: '../controller/askGetSmokeRun',
      functionName: 'askGetSmokeRun',
      actionProcessors: githubOidcAuth,
    }),
  ];
};
