import {
  AskResponse,
  NotifyErrorQueueErrorQueueEvent,
  NotifyErrorQueueThrottleQueueEvent,
  NotifyErrorQueueTimeoutQueueEvent,
  QueueEventResponse,
} from '@qpqjs/core';

import { notifyErrorLogic } from '../../logic/notifyError';

export function* onError(errorQueueEvent: NotifyErrorQueueErrorQueueEvent): AskResponse<QueueEventResponse> {
  yield* notifyErrorLogic.askNotifyErrorProcessError(errorQueueEvent.message.payload);

  return true;
}

export function* onTimeout(timeoutQueueEvent: NotifyErrorQueueTimeoutQueueEvent): AskResponse<QueueEventResponse> {
  yield* notifyErrorLogic.askNotifyErrorProcessTimeout(timeoutQueueEvent.message.payload);

  return true;
}

export function* onThrottle(timeoutQueueEvent: NotifyErrorQueueThrottleQueueEvent): AskResponse<QueueEventResponse> {
  yield* notifyErrorLogic.askNotifyErrorProcessThrottle(timeoutQueueEvent.message.payload);

  return true;
}
