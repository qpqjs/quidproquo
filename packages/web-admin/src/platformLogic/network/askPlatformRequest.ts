import { askNetworkRequest, HTTPMethod, HTTPRequestOptions } from '@qpqjs/core';

import { askUIShowError } from '../actionCreators/askUIShowError';
import { askUIStartLoading } from '../actionCreators/askUIStartLoading';
import { askUIStopLoading } from '../actionCreators/askUIStopLoading';
import { askLoadAuthToken } from '../config';
import { askBaseUrlsRead } from '../context';

export function* askPlatformRequest<TResult, TPayload = unknown>(method: HTTPMethod, url: string, httpRequestOptions?: HTTPRequestOptions<TPayload>) {
  const baseUrls = yield* askBaseUrlsRead();

  yield* askUIStartLoading();

  const authInfo = yield* askLoadAuthToken();

  const headers = {
    ...(httpRequestOptions?.headers || {}),
    ...(authInfo.authenticationInfo?.accessToken ? { Authorization: `Bearer ${authInfo.authenticationInfo.accessToken}` } : {}),
  };

  const response = yield* askNetworkRequest<TResult, TPayload>(method, url, {
    ...httpRequestOptions,
    headers,
    basePath: baseUrls.api,
  });

  if (response.status < 200 || response.status >= 300) {
    yield* askUIShowError(`Request Failed: ${method}::${url}`);
  }

  yield* askUIStopLoading();

  return response;
}
