import { askNetworkRequest, AskResponse, HTTPMethod, HTTPNetworkResponse } from '@qpqjs/core';

import { askLoadAuthToken } from '../../../platformLogic/config/askLoadAuthToken';
import { askBaseUrlsRead } from '../../../platformLogic/context';

// Quiet API request for session persistence: authorised like askPlatformRequest
// but with no global loading spinner or error toast, the flush is background
// bookkeeping, not user-facing navigation.
export function* askSessionApiRequest<TResult, TPayload = unknown>(
  method: HTTPMethod,
  url: string,
  body?: TPayload,
): AskResponse<HTTPNetworkResponse<TResult>> {
  const baseUrls = yield* askBaseUrlsRead();
  const authInfo = yield* askLoadAuthToken();

  return yield* askNetworkRequest<TResult, TPayload>(method, url, {
    body,
    headers: authInfo.authenticationInfo?.accessToken ? { Authorization: `Bearer ${authInfo.authenticationInfo.accessToken}` } : {},
    basePath: baseUrls.api,
  });
}
