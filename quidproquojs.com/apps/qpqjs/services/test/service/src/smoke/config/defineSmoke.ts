import {
  defineKeyValueStore,
  defineQueue,
  defineRoute,
  QPQConfig,
  QpqFunctionRuntime,
} from 'quidproquo';

import { SMOKE_RUNS_STORE } from '../constants/SMOKE_RUNS_STORE';
import {
  SMOKE_RUN_QUEUE,
  SMOKE_RUN_REQUESTED_MESSAGE_TYPE,
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
    // One record per run, keyed by runId; the queue entry updates it as tests
    // complete and the GET route polls it.
    defineKeyValueStore(SMOKE_RUNS_STORE, 'runId'),

    defineQueue(SMOKE_RUN_QUEUE, {
      [SMOKE_RUN_REQUESTED_MESSAGE_TYPE]: {
        basePath: __dirname,
        relativePath: '../queue/onSmokeRunRequested',
        functionName: 'onSmokeRunRequested',
      },
    }),

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
