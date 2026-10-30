import { AskResponse, createActionRequester } from '@qpqjs/core';

import { ServiceFunctionActionType } from './ServiceFunctionActionType';

export const askServiceFunctionExecuteBase = createActionRequester<unknown>()({
  actionType: ServiceFunctionActionType.Execute,
  getPayload: (service: string, functionName: string, payload: unknown, isAsync: boolean = false) => ({
    functionName,
    service,
    payload,
    isAsync,
  }),
});

// The remote function's payload and result types are only known to the caller, so the
// base takes and returns unknown and this story casts to what the caller declared.
export function* askServiceFunctionExecute<TResult, TPayload = unknown>(
  service: string,
  functionName: string,
  payload: TPayload,
  isAsync?: boolean,
): AskResponse<TResult> {
  return (yield* askServiceFunctionExecuteBase(service, functionName, payload, isAsync)) as TResult;
}
