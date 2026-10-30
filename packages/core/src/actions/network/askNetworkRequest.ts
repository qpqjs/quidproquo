import { createActionRequester } from '../../logic/actions/createActionRequester';
import { AskResponse } from '../../types/StorySession';
import { NetworkActionType } from './NetworkActionType';
import { HTTPMethod, HTTPNetworkResponse, HTTPRequestOptions, ResponseType } from './types';

// Named because the processor layer (executeNetworkRequest) and the web-react hooks
// build and consume this payload directly, without going through the requester.
export type NetworkRequestActionPayload<T> = {
  url: string;
  method: HTTPMethod;

  body?: T;
  basePath?: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  responseType: ResponseType;
};

export const askNetworkRequestBase = createActionRequester<HTTPNetworkResponse<unknown>>()({
  actionType: NetworkActionType.Request,
  errorTypes: [
    'Timeout', // the request exceeded the request timeout and was aborted
    'UnsupportedMethod', // the HTTP method is one the runtime refuses to send
    'NetworkError', // no response came back: no connection, DNS failure, CORS block, unparseable body
  ],
  getPayload: (method: HTTPMethod, url: string, httpRequestOptions?: HTTPRequestOptions<unknown>): NetworkRequestActionPayload<unknown> => ({
    url,
    method,

    body: httpRequestOptions?.body,
    headers: httpRequestOptions?.headers,
    basePath: httpRequestOptions?.basePath,
    params: httpRequestOptions?.params,
    responseType: httpRequestOptions?.responseType || 'json',
  }),
});

// The request and response body types are only known to the caller, so the base takes
// and returns unknown and this story casts to what the caller declared.
function* askNetworkRequestTyped<TResult, TPayload = unknown>(
  method: HTTPMethod,
  url: string,
  httpRequestOptions?: HTTPRequestOptions<TPayload>,
): AskResponse<HTTPNetworkResponse<TResult>> {
  return (yield* askNetworkRequestBase(method, url, httpRequestOptions)) as HTTPNetworkResponse<TResult>;
}

/** Carries the base requester's `errorType` catalog so callers can match on it. */
export const askNetworkRequest = Object.assign(askNetworkRequestTyped, { errorType: askNetworkRequestBase.errorType });
