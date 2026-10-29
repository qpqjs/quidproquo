import { AskResponse, createActionRequester } from '@qpqjs/core';

import { ServiceActionType } from './ServiceActionType';

export const askServiceRequestBase = createActionRequester<unknown>()({
  actionType: ServiceActionType.Request,
  getPayload: (serviceName: string, method: string, payload: unknown) => ({ serviceName, method, payload }),
});

// The request and response shapes are only known to the caller, so the base takes and
// returns unknown and this story casts to what the caller declared.
export function* askServiceRequest<TResult, TPayload = unknown>(serviceName: string, method: string, payload: TPayload): AskResponse<TResult> {
  return (yield* askServiceRequestBase(serviceName, method, payload)) as TResult;
}
