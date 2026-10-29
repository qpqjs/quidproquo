import {
  AskResponse,
  askStateDispatchBase,
  generateUuid,
  getDateNow,
  getProcessCustomImplementation,
  ProcessorFor,
  QPQConfig,
  StateActionType,
  StateDispatchActionPayload,
} from '@qpqjs/core';

import { askWebsocketConnectionInfoRead } from '../../context';
import { askWebSocketQueueSendEventMessageWithCorrelationToFrontend } from '../../logic/webSocket/askWebSocketQueueSendEventMessageWithCorrelationToFrontend';
import { WebSocketQueueServerEventMessageStateDispatch } from '../../types/serverMessages';
import { WebSocketQueueServerMessageEventType } from '../../types/serverMessages';

export function* askWebSocketQueueStateDispatchToFrontend(payload: StateDispatchActionPayload<any>): AskResponse<void> {
  const { connectionId, correlationId } = yield* askWebsocketConnectionInfoRead();

  const response: WebSocketQueueServerEventMessageStateDispatch = {
    type: WebSocketQueueServerMessageEventType.StateDispatch,
    payload: payload.action,
  };

  yield* askWebSocketQueueSendEventMessageWithCorrelationToFrontend({ ...response, correlationId }, connectionId);
}

export const getStateDispatch = (qpqConfig: QPQConfig) => ({
  [StateActionType.Dispatch]: getProcessCustomImplementation<ProcessorFor<typeof askStateDispatchBase>>(
    qpqConfig,
    askWebSocketQueueStateDispatchToFrontend,
    'Send state dispatch to UI',
    null,
    getDateNow,
    generateUuid,
  ),
});
