import {
  askNetworkRequest,
  askOpenApiGetDocument,
  AskResponse,
} from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

// The website lives on the api host minus its `api.` label (the app's web entry is
// on the root domain, the api on `api.` under it). Good enough for this app's probe.
const toWebsiteUrl = (apiBaseUrl: string): string => {
  const api = new URL(apiBaseUrl);
  return `https://${api.hostname.replace(/^api\./, '')}`;
};

const header = (
  headers: Record<string, string>,
  name: string
): string | undefined =>
  Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1];

// Checklist item: web entry security headers. Every web entry sends the baseline
// browser hardening headers whether or not the app configured any, so the site
// cannot be framed, sniffed or downgraded to http.
export function* askRunWebsiteSecurityHeadersTest(): AskResponse<void> {
  const document = yield* askOpenApiGetDocument();
  const baseUrl = document.servers[0]?.url;
  yield* askSmokeAssert(!!baseUrl, 'document lists no servers to call');
  const websiteUrl = toWebsiteUrl(baseUrl);

  const index = yield* askNetworkRequest<undefined, string>(
    'GET',
    `${websiteUrl}/`,
    { responseType: 'text' }
  );
  yield* askSmokeAssert(
    index.status === 200,
    `website index returned [${index.status}] from ${websiteUrl}`
  );

  const expected: [string, RegExp][] = [
    ['strict-transport-security', /max-age=\d+/],
    ['x-content-type-options', /^nosniff$/i],
    ['x-frame-options', /^DENY$/i],
    ['referrer-policy', /strict-origin-when-cross-origin/],
  ];
  for (const [name, pattern] of expected) {
    const value = header(index.headers, name);
    yield* askSmokeAssert(
      !!value && pattern.test(value),
      `website index is missing the ${name} header (got [${value ?? 'none'}])`
    );
  }
}
