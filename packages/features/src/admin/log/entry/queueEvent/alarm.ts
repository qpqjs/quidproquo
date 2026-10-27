import {
  AskResponse,
  NotifyErrorQueueErrorQueueEvent,
  NotifyErrorQueueThrottleQueueEvent,
  NotifyErrorQueueTimeoutQueueEvent,
  QueueEventResponse,
} from 'quidproquo-core';

import { notifyErrorLogic } from '../../logic/notifyError';

export function* onError(errorQueueEvent: NotifyErrorQueueErrorQueueEvent): AskResponse<QueueEventResponse> {
  yield* notifyErrorLogic.askProcessOnError(errorQueueEvent.message.payload);

  return true;
}

export function* onTimeout(timeoutQueueEvent: NotifyErrorQueueTimeoutQueueEvent): AskResponse<QueueEventResponse> {
  yield* notifyErrorLogic.askProcessOnTimeout(timeoutQueueEvent.message.payload);

  return true;
}

export function* onThrottle(timeoutQueueEvent: NotifyErrorQueueThrottleQueueEvent): AskResponse<QueueEventResponse> {
  yield* notifyErrorLogic.askProcessOnThrottle(timeoutQueueEvent.message.payload);

  return true;
}
