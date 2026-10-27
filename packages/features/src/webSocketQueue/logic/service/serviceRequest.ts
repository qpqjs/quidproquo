import { askCatch, AskResponse, QueueEvent, QueueEventResponse, QueueMessage } from 'quidproquo-core';

import { askServiceRequestRespond } from './askServiceRequestRespond';
import { ServiceRequester } from './createServiceRequester';
import { isServiceRequestDeferred } from './isServiceRequestDeferred';
import type { ServiceRequestDeferred } from './ServiceRequestDeferred';

type PayloadOf<R> = R extends ServiceRequester<infer T, any> ? T : never;
type ResponseOf<R> = R extends ServiceRequester<any, infer T> ? T : never;

export const serviceRequest = <R extends ServiceRequester<any, any>>(
  requester: R,
  runtime: (payload: PayloadOf<R>) => AskResponse<ResponseOf<R> | ServiceRequestDeferred>,
) => {
  const { method } = requester.serviceRequest;

  const wrapper = function* wrapper(event: QueueEvent<QueueMessage<any>>) {
    const result = yield* askCatch(runtime(event.message.payload));

    // A deferred result means another execution owns the reply.
    if (result.success && isServiceRequestDeferred(result.result)) {
      return true as QueueEventResponse;
    }

    yield* askServiceRequestRespond(result);

    return true as QueueEventResponse;
  };

  wrapper.serviceRequest = { method };

  return wrapper;
};
