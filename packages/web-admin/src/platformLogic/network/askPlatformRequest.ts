import { askContextRead, askNetworkRequest, HTTPMethod, HTTPRequestOptions } from 'quidproquo-core';

import { askLoadAuthToken } from '../config';
import { baseUrlsContext } from '../contexts';
import { askUIShowError, askUIStartLoading, askUIStopLoading } from '../effects';

export function* askPlatformRequest<T, R>(method: HTTPMethod, url: string, httpRequestOptions?: HTTPRequestOptions<T>) {
  const baseUrls = yield* askContextRead(baseUrlsContext);

  yield* askUIStartLoading();

  const authInfo = yield* askLoadAuthToken();

  const headers = {
    ...(httpRequestOptions?.headers || {}),
    ...(authInfo.authenticationInfo?.accessToken ? { Authorization: `Bearer ${authInfo.authenticationInfo.accessToken}` } : {}),
  };

  const response = yield* askNetworkRequest<T, R>(method, url, {
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
