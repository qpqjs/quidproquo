#!/usr/bin/env node
// Runs the smoke suite against a just-deployed test service and exits non-zero
// if it does not pass. The run itself lives in scripts/smoke/runSmokeRun.mjs,
// shared with localSmoke.mjs; this file only resolves which api to point it at.
//
// Runs inside the deploy workflow's deploy job, which supplies:
//   SMOKE_ENVIRONMENT               the environment that was just deployed (development, staging)
//   ACTIONS_ID_TOKEN_REQUEST_URL    provided by Actions when the job has id-token: write
//   ACTIONS_ID_TOKEN_REQUEST_TOKEN  provided by Actions when the job has id-token: write
//
// The api url is derived, not configured: the primary root domain comes from the
// app's constants package (the same value every service's defineDns reads),
// non-production environments are a subdomain of it under the app's default
// domain shape, and the api gateway maps each service under its own base path
// (see the CfnBasePathMapping in quidproquo-deploy-awscdk's api construct):
//   https://api.<environment>.<domain>/<service>

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runSmokeRun } from './smoke/runSmokeRun.mjs';

const SERVICE_NAME = 'test';
// The built constants package: the deploy job builds the app before this runs.
const DOMAIN_CONSTANTS_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../apps/qpqjs/packages/constants/dist/src/domain.js'
);

const log = (message) => console.log(`deployed-smoke: ${message}`);

const fail = (message) => {
  console.error(`deployed-smoke: ${message}`);
  process.exit(1);
};

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    fail(`${name} is not set`);
  }
  return value;
};

const deriveApiUrl = (environment) => {
  const { QPQJS_DOMAINS } = createRequire(import.meta.url)(
    DOMAIN_CONSTANTS_PATH
  );
  const [domain] = QPQJS_DOMAINS ?? [];
  if (!domain) {
    fail(`no QPQJS_DOMAINS in ${DOMAIN_CONSTANTS_PATH}; build the app first`);
  }
  const envDomain =
    environment === 'production' ? domain : `${environment}.${domain}`;
  return `https://api.${envDomain}/${SERVICE_NAME}`;
};

const environment = requireEnv('SMOKE_ENVIRONMENT');
const apiUrl = deriveApiUrl(environment);

log(`environment=${environment} api=${apiUrl}`);

runSmokeRun(apiUrl, log).catch((error) =>
  fail(error instanceof Error ? error.message : String(error))
);
