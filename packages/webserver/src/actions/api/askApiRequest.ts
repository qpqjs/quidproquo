import { Action, AskResponse, createActionRequester, HTTPMethod, HTTPNetworkResponse, HTTPRequestOptions, ResponseType } from '@qpqjs/core';

import { ApiActionType } from './ApiActionType';

// basePath is resolved by the processor, so it is omitted from the caller options
export type ApiRequestOptions<T> = Omit<HTTPRequestOptions<T>, 'basePath'>;
export interface ApiRequestActionPayload<T> {
  service: string;
  endpoint: string;
  method: HTTPMethod;
  body?: T;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  responseType: ResponseType;
}

export const askApiRequestBase = createActionRequester<HTTPNetworkResponse<unknown>>()({
  actionType: ApiActionType.Request,
  errorTypes: [
    'Timeout', // the request exceeded the request timeout and was aborted
    'UnsupportedMethod', // the HTTP method is one the runtime refuses to send
    'NetworkError', // no response came back: no connection, DNS failure, CORS block, unparseable body
  ],
  getPayload: (service: string, method: HTTPMethod, endpoint: string, options?: ApiRequestOptions<unknown>) => ({
    service,
    endpoint,
    method,
    body: options?.body,
    headers: options?.headers,
    params: options?.params,
    responseType: options?.responseType || 'json',
  }),
});

// The request and response body types are only known to the caller, so the base takes
// and returns unknown and this story casts to what the caller declared.
export function* askApiRequest<TResult, TPayload = unknown>(
  service: string,
  method: HTTPMethod,
  endpoint: string,
  options?: ApiRequestOptions<TPayload>,
): AskResponse<HTTPNetworkResponse<TResult>> {
  return (yield* askApiRequestBase(service, method, endpoint, options as ApiRequestOptions<unknown>)) as HTTPNetworkResponse<TResult>;
}
