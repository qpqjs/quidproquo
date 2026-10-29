import { askNetworkRequest, askOpenApiGetDocument, AskResponse } from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

// The website lives on the api host minus its `api.` label (the app's web entry is
// on the root domain, the api on `api.` under it). Good enough for this app's probe.
const toWebsiteUrl = (apiBaseUrl: string): string => {
  const api = new URL(apiBaseUrl);
  return `https://${api.hostname.replace(/^api\./, '')}`;
};

const looksLikeSourceMap = (body: string): boolean => body.trimStart().startsWith('{') && body.includes('"mappings"');

// Checklist item: bundle options. A production frontend build must not ship its
// source maps: a map next to the script hands anyone the whole views source tree,
// comments included. The script must carry no sourceMappingURL and the `.map`
// path must not answer with a map (the SPA error mapping answers with the index
// page instead, which is fine).
export function* askRunSourceMapNotServedTest(): AskResponse<void> {
  const document = yield* askOpenApiGetDocument();
  const baseUrl = document.servers[0]?.url;
  yield* askSmokeAssert(!!baseUrl, 'document lists no servers to call');
  const websiteUrl = toWebsiteUrl(baseUrl);

  const index = yield* askNetworkRequest<string, undefined>('GET', `${websiteUrl}/`, { responseType: 'text' });
  yield* askSmokeAssert(index.status === 200, `website index returned [${index.status}] from ${websiteUrl}`);
  const scriptSrc = /<script[^>]*src="([^"]+\.js)"/.exec(index.data)?.[1];
  yield* askSmokeAssert(!!scriptSrc, 'website index names no script to check');
  const scriptUrl = new URL(scriptSrc!, `${websiteUrl}/`).toString();

  const script = yield* askNetworkRequest<string, undefined>('GET', scriptUrl, {
    responseType: 'text',
  });
  yield* askSmokeAssert(script.status === 200, `script returned [${script.status}] from ${scriptUrl}`);
  yield* askSmokeAssert(!script.data.includes('sourceMappingURL='), `production script links a source map: ${scriptUrl}`);

  const map = yield* askNetworkRequest<string, undefined>('GET', `${scriptUrl}.map`, { responseType: 'text' });
  yield* askSmokeAssert(!(map.status === 200 && looksLikeSourceMap(map.data)), `the website serves a source map at ${scriptUrl}.map`);
}
