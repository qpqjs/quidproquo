#!/usr/bin/env node
// Drives one smoke run against a deployed test service and exits non-zero if
// it does not pass: mint a GitHub Actions OIDC token, POST /smoke/run, poll
// GET /smoke/run/{runId} until the run finishes or the deadline passes.
//
// Runs inside the deployed-smoke workflow job, which supplies:
//   SMOKE_ENVIRONMENT               the environment that was just deployed (development, staging)
//   ACTIONS_ID_TOKEN_REQUEST_URL    provided by Actions when the job has id-token: write
//   ACTIONS_ID_TOKEN_REQUEST_TOKEN  provided by Actions when the job has id-token: write
//
// The api url is derived, not configured: the apex domain comes from the app's
// deploy.config.json, non-production environments are a subdomain of it, and
// the api gateway maps each service under its own base path (see the
// CfnBasePathMapping in quidproquo-deploy-awscdk's api construct):
//   https://api.<environment>.<domain>/<service>
//
// No dependencies: Node 24's global fetch is all it needs.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AUDIENCE = 'qpq-smoke';
const DEADLINE_MS = 5 * 60 * 1000;
const POLL_MS = 5 * 1000;
const SERVICE_NAME = 'test';
const DEPLOY_CONFIG_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../apps/qpqjs/deploy.config.json'
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
  const { domain } = JSON.parse(readFileSync(DEPLOY_CONFIG_PATH, 'utf8'));
  if (!domain) {
    fail(`no "domain" in ${DEPLOY_CONFIG_PATH}`);
  }
  const envDomain =
    environment === 'production' ? domain : `${environment}.${domain}`;
  return `https://api.${envDomain}/${SERVICE_NAME}`;
};

const environment = requireEnv('SMOKE_ENVIRONMENT');
const apiUrl = deriveApiUrl(environment);
const tokenRequestUrl = requireEnv('ACTIONS_ID_TOKEN_REQUEST_URL');
const tokenRequestToken = requireEnv('ACTIONS_ID_TOKEN_REQUEST_TOKEN');

log(`environment=${environment} api=${apiUrl}`);

// OIDC tokens are short-lived (minutes), about as long as the poll deadline,
// so every request mints a fresh one rather than racing the expiry.
const mintToken = async () => {
  const response = await fetch(`${tokenRequestUrl}&audience=${AUDIENCE}`, {
    headers: { Authorization: `bearer ${tokenRequestToken}` },
  });
  if (!response.ok) {
    throw new Error(`token request failed with ${response.status}`);
  }
  const body = await response.json();
  if (!body.value) {
    throw new Error('token request returned no value');
  }
  return body.value;
};

const callApi = async (method, path) => {
  const response = await fetch(`${apiUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${await mintToken()}` },
  });
  if (!response.ok) {
    throw new Error(
      `${method} ${path} failed with ${response.status}: ${await response.text()}`
    );
  }
  return response.json();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const printTests = (tests) => {
  for (const test of tests) {
    log(
      `  #${test.id} ${test.name.padEnd(24)} ${test.status.padEnd(8)} ${test.message}`
    );
  }
};

const main = async () => {
  const { runId } = await callApi('POST', '/smoke/run');
  if (!runId) {
    fail('POST /smoke/run returned no runId');
  }
  log(`started run ${runId}`);

  const deadline = Date.now() + DEADLINE_MS;
  while (Date.now() < deadline) {
    const run = await callApi('GET', `/smoke/run/${runId}`);
    const { summary } = run;
    log(
      `status=${run.status} completed ${summary.completed}/${summary.total} passed ${summary.passed} failed ${summary.failed}`
    );

    if (run.status === 'passed' || run.status === 'failed') {
      printTests(run.tests);
      if (run.status === 'failed') {
        fail(`run ${runId} failed`);
      }
      return;
    }

    await sleep(POLL_MS);
  }

  fail(`timed out waiting for run ${runId}`);
};

main().catch((error) =>
  fail(error instanceof Error ? error.message : String(error))
);
