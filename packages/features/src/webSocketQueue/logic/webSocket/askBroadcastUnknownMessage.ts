import { askConfigGetGlobal, askEventBusSendMessages, AskResponse, EventBusMessage } from 'quidproquo-core';

import { getWebSocketQueueGlobalConfigKeyForEventBusName } from '../../config/defineWebSocketQueue';
import { askWebsocketReadApiNameOrThrow } from '../../context';
import { AnyWebSocketQueueEventMessageWithCorrelation } from '../../types';

export function* askBroadcastUnknownMessage({
  // We want to drop the correlationId
  correlationId,
  ...anyWebSocketQueueEventMessage
}: AnyWebSocketQueueEventMessageWithCorrelation): AskResponse<void> {
  const apiName = yield* askWebsocketReadApiNameOrThrow();
  const eventBusName = yield* askConfigGetGlobal<string>(getWebSocketQueueGlobalConfigKeyForEventBusName(apiName));

  yield* askEventBusSendMessages({
    eventBusName,
    eventBusMessages: [anyWebSocketQueueEventMessage as EventBusMessage<any>],
  });
}
