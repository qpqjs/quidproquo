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
// Urls are derived, not configured: the roots come from the app's constants
// package (the same list every service's defineDns reads), hosts follow the
// app's default domain shape (see getRootHosts), and the api gateway maps each
// service under its own base path:
//   https://api.<environment>.<root>/<service>

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { getRootHosts, runEdgeChecks } from './smoke/runEdgeChecks.mjs';
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

const getRoots = () => {
  const { QPQJS_DOMAINS } = createRequire(import.meta.url)(
    DOMAIN_CONSTANTS_PATH
  );
  if (!QPQJS_DOMAINS?.length) {
    fail(`no QPQJS_DOMAINS in ${DOMAIN_CONSTANTS_PATH}; build the app first`);
  }

  const subset = process.env.SMOKE_ROOTS?.split(',')
    .map((root) => root.trim())
    .filter(Boolean);
  if (!subset?.length) {
    return QPQJS_DOMAINS;
  }

  const unknown = subset.filter((root) => !QPQJS_DOMAINS.includes(root));
  if (unknown.length > 0) {
    fail(`SMOKE_ROOTS names roots not in QPQJS_DOMAINS: ${unknown.join(', ')}`);
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
const roots = getRoots();
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
