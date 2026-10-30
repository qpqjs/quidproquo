import { askNetworkRequest, HTTPMethod, HTTPRequestOptions } from '@qpqjs/core';

import { askSystemShowError } from '../actionCreators/askSystemShowError';
import { askSystemStartLoading } from '../actionCreators/askSystemStartLoading';
import { askSystemStopLoading } from '../actionCreators/askSystemStopLoading';
import { askLoadAuthToken } from '../config';
import { askBaseUrlsRead } from '../context';

export function* askPlatformRequest<TResult, TPayload = unknown>(method: HTTPMethod, url: string, httpRequestOptions?: HTTPRequestOptions<TPayload>) {
  const baseUrls = yield* askBaseUrlsRead();

  yield* askSystemStartLoading();

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
    yield* askSystemShowError(`Request Failed: ${method}::${url}`);
  }

  yield* askSystemStopLoading();

  return response;
}
