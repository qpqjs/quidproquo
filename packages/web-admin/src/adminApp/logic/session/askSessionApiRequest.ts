import { askContextRead, askNetworkRequest, AskResponse, HTTPMethod, HTTPNetworkResponse } from 'quidproquo-core';

import { askLoadAuthToken } from '../../../platformLogic/config/askLoadAuthToken';
import { baseUrlsContext } from '../../../platformLogic/contexts/baseUrlContext';

// Quiet API request for session persistence: authorised like askPlatformRequest
// but with no global loading spinner or error toast — the flush is background
// bookkeeping, not user-facing navigation.
export function* askSessionApiRequest<TBody, TResponse>(method: HTTPMethod, url: string, body?: TBody): AskResponse<HTTPNetworkResponse<TResponse>> {
  const baseUrls = yield* askContextRead(baseUrlsContext);
  const authInfo = yield* askLoadAuthToken();

  return yield* askNetworkRequest<TBody, TResponse>(method, url, {
    body,
    headers: authInfo.authenticationInfo?.accessToken ? { Authorization: `Bearer ${authInfo.authenticationInfo.accessToken}` } : {},
    basePath: baseUrls.api,
  });
}
