import { askNetworkRequest, askOpenApiGetDocument, AskResponse } from 'quidproquo';

import { askSmokeAssert } from '../../assert/askSmokeAssert';
import { SmokeWebsiteIndex } from './SmokeWebsiteIndex';
import { toWebsiteUrl } from './toWebsiteUrl';

// Every website probe starts the same way: find the website from the api document, fetch
// its index page and fail unless it answered 200. The probe then inspects the page or its
// headers.
export function* askSmokeFetchWebsiteIndex(): AskResponse<SmokeWebsiteIndex> {
  const document = yield* askOpenApiGetDocument();
  const baseUrl = document.servers[0]?.url;
  yield* askSmokeAssert(!!baseUrl, 'document lists no servers to call');
  const websiteUrl = toWebsiteUrl(baseUrl!);

  const index = yield* askNetworkRequest<string, undefined>('GET', `${websiteUrl}/`, { responseType: 'text' });
  yield* askSmokeAssert(index.status === 200, `website index returned [${index.status}] from ${websiteUrl}`);

  return { websiteUrl, index };
}
