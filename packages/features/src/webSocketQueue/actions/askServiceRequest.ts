import { AskResponse, createActionRequester } from '@qpqjs/core';

import { ServiceActionType } from './ServiceActionType';

/** How a service request is sent. `timeoutMs` fails the request with Timeout when no response arrives in time; without it the request waits for as long as it takes. */
export type ServiceRequestOptions = {
  timeoutMs?: number;
};

export const askServiceRequestBase = createActionRequester<unknown>()({
  actionType: ServiceActionType.Request,
  errorTypes: [
    'Timeout', // no response arrived within the time limit the caller set
  ],
  getPayload: (serviceName: string, method: string, payload: unknown, options?: ServiceRequestOptions) => ({
    serviceName,
    method,
    payload,
    timeoutMs: options?.timeoutMs,
  }),
});

// The request and response shapes are only known to the caller, so the base takes and
// returns unknown and this story casts to what the caller declared.
function* askServiceRequestTyped<TResult, TPayload = unknown>(
  serviceName: string,
  method: string,
  payload: TPayload,
  options?: ServiceRequestOptions,
): AskResponse<TResult> {
  return (yield* askServiceRequestBase(serviceName, method, payload, options)) as TResult;
}

/** Carries the base requester's `errorType` catalog so callers can match on it. */
export const askServiceRequest = Object.assign(askServiceRequestTyped, { errorType: askServiceRequestBase.errorType });
