// Drives one smoke run against a test service and reports whether it passed:
// mint a GitHub Actions OIDC token, POST /smoke/run, poll GET
// /smoke/run/{runId} until the run finishes or the deadline passes.
//
// Target-agnostic on purpose. The two callers differ only in the api url they
// resolve, which each derives for itself:
//   deployedSmoke.mjs  the just-deployed environment, from the app domain constant
//   localSmoke.mjs     a dev server it started, on localhost
//
// Both talk to the same routes over the same protocol with the same token, so
// a local run rehearses the deployed one rather than approximating it.
//
// No dependencies: Node's global fetch is all it needs.

const AUDIENCE = 'qpq-smoke';
const DEADLINE_MS = 5 * 60 * 1000;
const POLL_MS = 5 * 1000;
// GitHub's token service now and then answers 5xx or drops the connection, which
// would otherwise fail a deploy whose smoke run is passing. Retried after 1s, 2s, 4s.
const TOKEN_ATTEMPTS = 4;
const TOKEN_RETRY_MS = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// One request to GitHub's token service: its response, or why it is worth asking
// again (a 5xx, or no answer at all). A 4xx comes back as a response: the job is
// not allowed a token, and asking again will not change that.
const requestToken = async (url, bearer) => {
  try {
    const response = await fetch(url, { headers: { Authorization: `bearer ${bearer}` } });
    return response.status >= 500 ? { retryReason: `${response.status}` } : { response };
  } catch (error) {
    return { retryReason: error instanceof Error ? error.message : String(error) };
  }
};

const readToken = async (response) => {
  if (!response.ok) {
    throw new Error(`token request failed with ${response.status}`);
  }
  const body = await response.json();
  if (!body.value) {
    throw new Error('token request returned no value');
  }
  return body.value;
};

// OIDC tokens are short-lived (minutes), about as long as the poll deadline,
// so every request mints a fresh one rather than racing the expiry.
const mintToken = async () => {
  const tokenRequestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const tokenRequestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;

  if (!tokenRequestUrl || !tokenRequestToken) {
    throw new Error(
      'ACTIONS_ID_TOKEN_REQUEST_URL / ACTIONS_ID_TOKEN_REQUEST_TOKEN are not set. This needs a GitHub Actions job with `permissions: id-token: write`',
    );
  }

  let retryReason = '';
  for (let attempt = 1; attempt <= TOKEN_ATTEMPTS; attempt += 1) {
    const result = await requestToken(`${tokenRequestUrl}&audience=${AUDIENCE}`, tokenRequestToken);
    if (result.response) {
      return readToken(result.response);
    }
    retryReason = result.retryReason;
    if (attempt < TOKEN_ATTEMPTS) {
      await sleep(TOKEN_RETRY_MS * 2 ** (attempt - 1));
    }
  }
  throw new Error(`token request failed with ${retryReason}, ${TOKEN_ATTEMPTS} times`);
};

const printTests = (log, tests) => {
  for (const test of tests) {
    log(`  #${test.id} ${test.name.padEnd(24)} ${test.status.padEnd(8)} ${test.message}`);
  }
};

/**
 * Run the smoke suite against `apiUrl` and resolve if it passed.
 *
 * Throws on anything else (a failed run, an unreachable api, a run that never
 * finishes) so a caller can let it reach its top-level catch and exit 1.
 */
export const runSmokeRun = async (apiUrl, log) => {
  const callApi = async (method, path) => {
    const response = await fetch(`${apiUrl}${path}`, {
      method,
      headers: { Authorization: `Bearer ${await mintToken()}` },
    });
    if (!response.ok) {
      throw new Error(`${method} ${path} failed with ${response.status}: ${await response.text()}`);
    }
    return response.json();
  };

  const { runId } = await callApi('POST', '/smoke/run');
  if (!runId) {
    throw new Error('POST /smoke/run returned no runId');
  }
  log(`started run ${runId}`);

  const deadline = Date.now() + DEADLINE_MS;
  while (Date.now() < deadline) {
    const run = await callApi('GET', `/smoke/run/${runId}`);
    const { summary } = run;
    log(
      `status=${run.status} completed ${summary.completed}/${summary.total} passed ${summary.passed} failed ${summary.failed} skipped ${summary.skipped}`,
    );

    if (run.status === 'passed' || run.status === 'failed') {
      printTests(log, run.tests);
      if (run.status === 'failed') {
        throw new Error(`run ${runId} failed`);
      }
      return;
    }

    await sleep(POLL_MS);
  }

  throw new Error(`timed out waiting for run ${runId}`);
};
