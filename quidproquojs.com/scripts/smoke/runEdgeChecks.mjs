// Edge checks for one root domain: what the in-lambda smoke suite cannot see
// from inside, namely the CloudFront aliases, the api gateway custom domain,
// the certificates and the cross-root CORS listing. Plain fetches, no token.
//
// Every check returns { name, ok, detail } rather than throwing, so a root
// reports its whole table before the run decides pass or fail.

const TIMEOUT_MS = 15 * 1000;

const fetchWithTimeout = (url, init = {}) =>
  fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: 'manual',
  });

// Hosts for one root under the app's default shape (`<sub>.<env>.<root>`, no
// environment label in production). If the app ever adds a domain resolver
// pointer, derive these with quidproquo-webserver's resolveHosts instead.
export const getRootHosts = (root, environment) => {
  const site = environment === 'production' ? root : `${environment}.${root}`;

  return {
    root,
    site,
    api: `api.${site}`,
    views: `views.${site}`,
    docs: `docs.${site}`,
  };
};

const check = async (name, run) => {
  try {
    const detail = await run();
    return { name, ok: true, detail };
  } catch (error) {
    return {
      name,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    };
  }
};

const expectStatus = async (url, statuses) => {
  const response = await fetchWithTimeout(url);
  if (!statuses.includes(response.status)) {
    throw new Error(`${url} -> ${response.status}`);
  }
  return `${response.status}`;
};

// CloudFront serves index.html for the site root and the docs; the views host
// is a module-federation remote root, whose own root may 403 while its manifest
// serves, so accept either a 200 or a redirect there.
const checkServed = (hosts) => [
  check('site root served', () =>
    expectStatus(`https://${hosts.site}/`, [200, 301, 302])
  ),
  check('docs served', () =>
    expectStatus(`https://${hosts.docs}/`, [200, 301, 302])
  ),
  check('views served', () =>
    expectStatus(`https://${hosts.views}/`, [200, 301, 302, 403, 404])
  ),
  check('api health', () =>
    expectStatus(`https://${hosts.api}/shell/v1/health`, [200])
  ),
];

// The OpenAPI servers list is the runtime's own view of the roots: it proves
// the deployed lambda resolves every root, not just the one it was reached on.
const checkOpenApiServers = (hosts, allHosts) =>
  check('openapi lists every root', async () => {
    const response = await fetchWithTimeout(
      `https://${hosts.api}/test/v1/docs/openapi.json`
    );
    if (!response.ok) {
      throw new Error(`openapi.json -> ${response.status}`);
    }
    const servers = ((await response.json()).servers ?? []).map(
      (server) => server.url
    );
    const missing = allHosts
      .map((other) => other.api)
      .filter((api) => !servers.some((url) => url.includes(api)));
    if (missing.length > 0) {
      throw new Error(
        `servers ${JSON.stringify(servers)} missing ${missing.join(', ')}`
      );
    }
    return `${servers.length} servers`;
  });

// A page on root B calls the api on root A: the preflight must echo B's origin.
const checkCrossRootCors = (hosts, allHosts) =>
  allHosts
    .filter((other) => other.root !== hosts.root)
    .map((other) =>
      check(`api cors allows ${other.site}`, async () => {
        const origin = `https://${other.site}`;
        const response = await fetchWithTimeout(
          `https://${hosts.api}/shell/v1/health`,
          {
            method: 'OPTIONS',
            headers: { Origin: origin, 'Access-Control-Request-Method': 'GET' },
          }
        );
        const allowed = response.headers.get('access-control-allow-origin');
        if (allowed !== origin && allowed !== '*') {
          throw new Error(
            `allow-origin ${allowed ?? '(none)'} for origin ${origin}`
          );
        }
        return allowed;
      })
    );

// The module-federation remotes are baked to the primary root, so a page on
// an alternate root loads them cross-origin; the views web entry's cors policy
// must allow that origin.
const checkViewsAssetCors = (hosts, allHosts) =>
  allHosts
    .filter((other) => other.root !== hosts.root)
    .map((other) =>
      check(`views cors allows ${other.site}`, async () => {
        const origin = `https://${other.site}`;
        const response = await fetchWithTimeout(
          `https://${hosts.views}/shell/mf-manifest.json`,
          { headers: { Origin: origin } }
        );
        const allowed = response.headers.get('access-control-allow-origin');
        if (!allowed) {
          throw new Error(
            `no allow-origin header (status ${response.status}) for origin ${origin}`
          );
        }
        return allowed;
      })
    );

/**
 * Run every edge check for one root against the full root list and resolve the
 * results, never throwing; `ok` is false on every row that failed.
 */
export const runEdgeChecks = async (hosts, allHosts) =>
  Promise.all([
    ...checkServed(hosts),
    checkOpenApiServers(hosts, allHosts),
    ...checkCrossRootCors(hosts, allHosts),
    ...checkViewsAssetCors(hosts, allHosts),
  ]);
