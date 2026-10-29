import { askDecodeJson, AskResponse, isString } from '@qpqjs/core';
import { WebsocketEvent } from '@qpqjs/webserver';

import { askWebsocketConnectionInfoProvide } from '../../context';
import { webSocketQueueLogic } from '../../logic';
import { AnyWebSocketQueueEventMessageWithCorrelation } from '../../types';

export function* onConnect(event: WebsocketEvent): AskResponse<void> {
  yield* askWebsocketConnectionInfoProvide(
    {
      apiName: event.apiName,
      connectionId: event.connectionId,
    },
    webSocketQueueLogic.askWebSocketQueueProcessConnect(event.connectionId, event.requestTime, event.requestTimeEpoch, event.sourceIp),
  );
}

export function* onDisconnect(event: WebsocketEvent): AskResponse<void> {
  yield* askWebsocketConnectionInfoProvide(
    {
      apiName: event.apiName,
      connectionId: event.connectionId,
    },
    webSocketQueueLogic.askWebSocketQueueProcessDisconnect(event.connectionId),
  );
}

export function* onMessage(event: WebsocketEvent): AskResponse<void> {
  if (!isString(event.body)) {
    return;
  }

  const message = yield* askDecodeJson<AnyWebSocketQueueEventMessageWithCorrelation>(event.body);

  yield* askWebsocketConnectionInfoProvide(
    {
      apiName: event.apiName,
      connectionId: event.connectionId,
      correlationId: message.correlationId,
    },
    webSocketQueueLogic.askWebSocketQueueProcessMessage(event.connectionId, message),
  );
}
