import {
  defineKeyValueStore,
  defineQueue,
  defineRoute,
  QPQConfig,
  QpqFunctionRuntime,
} from 'quidproquo';

import { z } from 'zod/v4';
import { SMOKE_PROBE_STORE } from '@qpqjs/constants';
import {
  SmokeProbeRecord,
  SmokeRunStartedSchema,
  SmokeRunWithSummarySchema,
} from '@qpqjs/test-models';

import { SMOKE_RUNS_STORE } from '../constants/SMOKE_RUNS_STORE';
import {
  SMOKE_RUN_QUEUE,
  SMOKE_TEST_REQUESTED_MESSAGE_TYPE,
} from '../constants/smokeRunQueue';

/**
 * The part of the smoke feature every suite relies on: the run store, the
 * queue runs execute on, the shared probe store and the two routes. Knows
 * nothing about individual suites; defineSmoke adds theirs alongside.
 *
 * The routes look public (no user directory, no api keys) but carry a
 * per-runtime action processor override that swaps the route auth decode for
 * the GitHub OIDC validator, so ONLY a GitHub Actions run of our repo holding
 * an OIDC token with the qpq-smoke audience and matching pinned claims gets
 * past the preamble. Everything else 401s, tokenless included.
 */
export const defineSmokeHarness = (): QPQConfig => {
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

    // Every async suite's handler writes its marker here for
    // askSmokePollForMarker. The keyValueStore suite queries its `category`
    // index, proving the `table/*/index/*` half of the tag-conditioned grant,
    // and testa reaches it cross-service.
    defineKeyValueStore<SmokeProbeRecord>(SMOKE_PROBE_STORE, 'probeId', [], {
      indexes: ['category'],
    }),

    // The zod models double as the routes' published contract, flattened to
    // JSON Schema here for the OpenAPI document at /v1/docs.
    defineRoute(
      'POST',
      '/smoke/run',
      {
        basePath: __dirname,
        relativePath: '../controller/askRunSmokeTests',
        functionName: 'askRunSmokeTests',
        actionProcessors: githubOidcAuth,
      },
      {
        schema: {
          summary: 'Start a smoke run',
          description:
            'Queues every registered smoke test and returns the run id to poll. Requires a GitHub Actions OIDC token for this repo.',
          tags: ['smoke'],
          responseJsonSchema: z.toJSONSchema(SmokeRunStartedSchema),
        },
      }
    ),

    defineRoute(
      'GET',
      '/smoke/run/{runId}',
      {
        basePath: __dirname,
        relativePath: '../controller/askGetSmokeRun',
        functionName: 'askGetSmokeRun',
        actionProcessors: githubOidcAuth,
      },
      {
        schema: {
          summary: 'Get a smoke run',
          description:
            'The stored run plus pass/fail counts. Poll until status leaves running.',
          tags: ['smoke'],
          responseJsonSchema: z.toJSONSchema(SmokeRunWithSummarySchema),
        },
      }
    ),
  ];
};
