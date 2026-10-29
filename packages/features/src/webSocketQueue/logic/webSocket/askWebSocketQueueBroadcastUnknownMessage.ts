import { askConfigGetGlobal, askEventBusSendMessages, AskResponse, EventBusMessage } from '@qpqjs/core';

import { getWebSocketQueueGlobalConfigKeyForEventBusName } from '../../config/defineWebSocketQueue';
import { askWebsocketApiNameReadOrThrow } from '../../context';
import { AnyWebSocketQueueEventMessageWithCorrelation } from '../../types';

export function* askWebSocketQueueBroadcastUnknownMessage({
  // We want to drop the correlationId
  correlationId,
  ...anyWebSocketQueueEventMessage
}: AnyWebSocketQueueEventMessageWithCorrelation): AskResponse<void> {
  const apiName = yield* askWebsocketApiNameReadOrThrow();
  const eventBusName = yield* askConfigGetGlobal<string>(getWebSocketQueueGlobalConfigKeyForEventBusName(apiName));

  yield* askEventBusSendMessages({
    eventBusName,
    eventBusMessages: [anyWebSocketQueueEventMessage as EventBusMessage<any>],
  });
}
