#!/usr/bin/env node
// Runs the smoke suite against a dev server this script starts, and exits
// non-zero if it does not pass. The run itself lives in
// scripts/smoke/runSmokeRun.mjs, shared with deployedSmoke.mjs.
//
// This is a pre-flight gate, not a replacement for the deployed smoke: the
// same stories run against the dev server's implementations instead of AWS, so
// it catches a broken probe, or the dev server drifting from deployed
// behaviour, on a pull request rather than after a deploy. It cannot catch
// anything the deployed run exists for - iam grants, resource naming, cdk
// wiring, api gateway base path mapping.
//
// Needs a GitHub Actions job with `permissions: id-token: write` and
// `environment: development`, because the smoke routes validate the token's
// environment claim against the service's own module environment - and a dev
// server is always development (primeDeployEnvFromConfig defaults it), whatever
// environment the deploy that follows is targeting.
//
// The api url is derived, not configured, same as the deployed script - but to
// a different SHAPE, which is why the two derive separately rather than
// sharing a template. Deployed, api gateway maps each service under its own
// base path on the api domain. Locally the dev server routes on
// /{apiSubdomain}/{serviceName} (see apiImplementation's devPath), and the app
// declares defineApi('api', ...):
//   http://localhost:8080/api/test

import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runSmokeRun } from './smoke/runSmokeRun.mjs';

// The dev server defaults to this anyway; set explicitly so a CI runner that
// already has ENVIRONMENT set (the deploy workflow does) cannot change what
// the smoke routes expect from the token. Must match the job's `environment:`.
const ENVIRONMENT = 'development';

// There is more than one app under apps/, so the app has to be named: without
// it the cli exits with the app list rather than picking one.
const APP_NAME = 'qpqjs';

// 8080 is the dev server's api port, set in the generated entry.
const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/test`;
const READY_URL = `${BASE_URL}/admin/service/ready`;

// Generous: a cold start bundles every service with rspack before the server
// process even launches.
const READY_TIMEOUT_MS = 5 * 60 * 1000;
const READY_POLL_MS = 2 * 1000;

// Above the dev server's own 5s worst-case shutdown budget.
const STOP_TIMEOUT_MS = 15 * 1000;

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const log = (message) => console.log(`local-smoke: ${message}`);

const fail = (message) => {
  console.error(`local-smoke: ${message}`);
  process.exit(1);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Wait until the dev server reports every plugin started.
 *
 * Deliberately not a TCP connect: the api plugin binds its port partway
 * through the start sequence, so a socket opens before the queue and the
 * stores are up, and the first POST would race them.
 */
const waitForReady = async (server) => {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(
        `dev server exited with ${server.exitCode} before it was ready`
      );
    }

    try {
      const response = await fetch(READY_URL);
      if (response.ok) {
        return;
      }
    } catch {
      // Not listening yet. Nothing to report until the deadline passes.
    }

    await sleep(READY_POLL_MS);
  }

  throw new Error(`dev server was not ready within ${READY_TIMEOUT_MS}ms`);
};

/**
 * Stop the dev server and resolve with its exit code.
 *
 * SIGTERM rather than SIGKILL because the graceful path is part of what this
 * script checks: the server should stop accepting, drain the smoke run's
 * in-flight work and checkpoint its stores, then exit 0. A non-zero code means
 * a teardown broke or a phase ran out of budget.
 */
const stopServer = (server) =>
  new Promise((resolve) => {
    if (server.exitCode !== null) {
      resolve(server.exitCode);
      return;
    }

    const timer = setTimeout(() => {
      log(
        `dev server did not stop within ${STOP_TIMEOUT_MS}ms, sending SIGKILL`
      );
      server.kill('SIGKILL');
    }, STOP_TIMEOUT_MS);

    server.once('exit', (code) => {
      clearTimeout(timer);
      resolve(code);
    });

    server.kill('SIGTERM');
  });

const main = async () => {
  log(`starting dev server (app=${APP_NAME} env=${ENVIRONMENT})`);

  const server = spawn('npx', ['qpq', 'go:dev:api', '--app', APP_NAME], {
    cwd: APP_ROOT,
    stdio: 'inherit',
    env: { ...process.env, ENVIRONMENT },
  });

  // The server is stopped either way, but a smoke failure is reported ahead of
  // a dirty shutdown: it is the more useful of the two, and letting the
  // shutdown check throw first would bury it.
  let smokeError = null;

  try {
    await waitForReady(server);
    log(`dev server ready, api=${API_URL}`);

    await runSmokeRun(API_URL, log);
  } catch (error) {
    smokeError = error;
  }

  const code = await stopServer(server);
  log(`dev server exited with ${code}`);

  if (smokeError) {
    throw smokeError;
  }

  if (code !== 0) {
    throw new Error(`dev server did not shut down cleanly (exit ${code})`);
  }
};

main().catch((error) =>
  fail(error instanceof Error ? error.message : String(error))
);
