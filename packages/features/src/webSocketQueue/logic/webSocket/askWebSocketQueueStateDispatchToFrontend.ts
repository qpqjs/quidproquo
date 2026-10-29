import { AskResponse, StateDispatchActionPayload } from '@qpqjs/core';

import { askWebsocketConnectionInfoRead } from '../../context';
import { WebSocketQueueServerEventMessageStateDispatch, WebSocketQueueServerMessageEventType } from '../../types/serverMessages';
import { askWebSocketQueueSendEventMessageWithCorrelationToFrontend } from './askWebSocketQueueSendEventMessageWithCorrelationToFrontend';

export function* askWebSocketQueueStateDispatchToFrontend(payload: StateDispatchActionPayload<any>): AskResponse<void> {
  const { connectionId, correlationId } = yield* askWebsocketConnectionInfoRead();

  const response: WebSocketQueueServerEventMessageStateDispatch = {
    type: WebSocketQueueServerMessageEventType.StateDispatch,
    payload: payload.action,
  };

  yield* askWebSocketQueueSendEventMessageWithCorrelationToFrontend({ ...response, correlationId }, connectionId);
}
