import { AskResponse } from 'quidproquo-core';

import { askServiceRequest } from './askServiceRequest';

export interface ServiceRequester<TPayload, TResponse> {
  (payload: TPayload): AskResponse<TResponse>;
  serviceRequest: { serviceName: string; method: string };
}

export const createServiceRequester = <TPayload, TResponse = void>(serviceName: string, method: string) => {
  const requester = function* askWrapServiceRequest(payload: TPayload): AskResponse<TResponse> {
    return yield* askServiceRequest(serviceName, method, payload);
  };

  requester.serviceRequest = { serviceName, method };

  return requester as ServiceRequester<TPayload, TResponse>;
};
