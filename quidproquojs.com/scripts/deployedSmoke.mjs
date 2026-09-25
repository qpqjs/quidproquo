#!/usr/bin/env node
// Runs the smoke suite against a just-deployed test service on EVERY root
// domain and exits non-zero if any root does not pass. Per root it runs the
// edge checks (scripts/smoke/runEdgeChecks.mjs: aliases, certs, cross-root
// cors, no token) and then the api smoke run (scripts/smoke/runSmokeRun.mjs,
// shared with localSmoke.mjs); this file only resolves where to point them.
//
// Runs inside the deploy workflow's deploy job, which supplies:
//   SMOKE_ENVIRONMENT               the environment that was just deployed (development, staging)
//   ACTIONS_ID_TOKEN_REQUEST_URL    provided by Actions when the job has id-token: write
//   ACTIONS_ID_TOKEN_REQUEST_TOKEN  provided by Actions when the job has id-token: write
//   SMOKE_ROOTS                     optional comma list to run a subset of the roots
//
// Urls are derived, not configured: the roots come from the deployment's
// ROOT_DOMAINS setting in apps/qpqjs/deploy.config.json (the same list every
// service's defineDns reads; the deployment is named after the environment),
// hosts follow the app's default domain shape (see getRootHosts), and the api
// gateway maps each service under its own base path:
//   https://api.<environment>.<root>/<service>

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getRootHosts, runEdgeChecks } from './smoke/runEdgeChecks.mjs';
import { runSmokeRun } from './smoke/runSmokeRun.mjs';

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

const splitList = (value) =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const getRoots = (environment) => {
  const { deployments } = JSON.parse(readFileSync(DEPLOY_CONFIG_PATH, 'utf8'));
  const allRoots = splitList(deployments[environment]?.settings?.ROOT_DOMAINS);
  if (!allRoots.length) {
    fail(
      `deployment '${environment}' in ${DEPLOY_CONFIG_PATH} has no ROOT_DOMAINS setting`
    );
  }

  const subset = splitList(process.env.SMOKE_ROOTS);
  if (!subset.length) {
    return allRoots;
  }

  const unknown = subset.filter((root) => !allRoots.includes(root));
  if (unknown.length > 0) {
    fail(`SMOKE_ROOTS names roots not in ROOT_DOMAINS: ${unknown.join(', ')}`);
  }
  return subset;
};

const printTable = (root, results) => {
  for (const result of results) {
    log(
      `  [${root}] ${result.ok ? 'pass' : 'FAIL'}  ${result.name.padEnd(36)} ${result.detail}`
    );
  }
};

// Every root runs to the end, so one report covers all of them.
const smokeRoot = async (hosts, allHosts) => {
  const rootLog = (message) => log(`[${hosts.root}] ${message}`);
  rootLog(`edge checks against ${hosts.site}`);

  const edge = await runEdgeChecks(hosts, allHosts);
  printTable(hosts.root, edge);
  const edgeOk = edge.every((result) => result.ok);

  const apiUrl = `https://${hosts.api}/${SERVICE_NAME}`;
  rootLog(`api smoke against ${apiUrl}`);
  let apiOk = true;
  try {
    await runSmokeRun(apiUrl, rootLog);
  } catch (error) {
    apiOk = false;
    rootLog(
      `api smoke failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return edgeOk && apiOk;
};

const environment = requireEnv('SMOKE_ENVIRONMENT');
const roots = getRoots(environment);
const allHosts = roots.map((root) => getRootHosts(root, environment));

log(`environment=${environment} roots=${roots.join(', ')}`);

const outcomes = [];
for (const hosts of allHosts) {
  outcomes.push({ root: hosts.root, ok: await smokeRoot(hosts, allHosts) });
}

for (const outcome of outcomes) {
  log(`${outcome.ok ? 'PASS' : 'FAIL'} ${outcome.root}`);
}

if (outcomes.some((outcome) => !outcome.ok)) {
  fail(`${outcomes.filter((outcome) => !outcome.ok).length} root(s) failed`);
}
