import { askNetworkRequest, AskResponse } from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { askSmokeFetchWebsiteIndex } from '../../../harness/logic/website/askSmokeFetchWebsiteIndex';

const looksLikeSourceMap = (body: string): boolean => body.trimStart().startsWith('{') && body.includes('"mappings"');

// Checklist item: bundle options. A production frontend build must not ship its
// source maps: a map next to the script hands anyone the whole views source tree,
// comments included. The script must carry no sourceMappingURL and the `.map`
// path must not answer with a map (the SPA error mapping answers with the index
// page instead, which is fine).
export function* askRunSourceMapNotServedTest(): AskResponse<void> {
  const { websiteUrl, index } = yield* askSmokeFetchWebsiteIndex();
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
