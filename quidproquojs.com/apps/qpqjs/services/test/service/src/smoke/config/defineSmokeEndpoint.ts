import { defineRoute, QPQConfig, QpqFunctionRuntime } from 'quidproquo';

// The smoke routes look public (no user directory, no api keys) but carry a
// per-runtime action processor override that swaps the route auth decode for
// the GitHub OIDC validator - so ONLY a GitHub Actions run of our repo,
// holding an OIDC token with the qpq-smoke audience and matching pinned
// claims, gets past the preamble. Everything else 401s, tokenless included.
//
// Runtimes are located relative to this file, so the module can move as a unit.
export const defineSmokeEndpoint = (): QPQConfig => {
  const githubOidcAuth: QpqFunctionRuntime[] = [
    {
      basePath: __dirname,
      relativePath: '../processors/github/getGithubOidcAuthProcessors',
      functionName: 'getGithubOidcAuthProcessors',
    },
  ];

  return [
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
