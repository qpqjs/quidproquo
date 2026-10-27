import {
  askLog,
  AskResponse,
  askStateDispatchBase,
  getProcessCustomImplementation,
  ProcessorFor,
  QPQConfig,
  StateActionType,
  StateDispatchActionPayload,
} from 'quidproquo-core';

import { randomUUID } from 'crypto';

import { askWebsocketReadConnectionInfo } from '../../context';
import { askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend } from '../../logic/webSocket/askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend';
import { WebSocketQueueServerEventMessageStateDispatch } from '../../types/serverMessages';
import { WebSocketQueueServerMessageEventType } from '../../types/serverMessages';

export function* askStateDispatchToFrontend(payload: StateDispatchActionPayload<any>): AskResponse<void> {
  const { connectionId, correlationId } = yield* askWebsocketReadConnectionInfo();

  const response: WebSocketQueueServerEventMessageStateDispatch = {
    type: WebSocketQueueServerMessageEventType.StateDispatch,
    payload: payload.action,
  };

  yield* askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend({ ...response, correlationId }, connectionId);
}

export const getStateDispatch = (qpqConfig: QPQConfig) => ({
  [StateActionType.Dispatch]: getProcessCustomImplementation<ProcessorFor<typeof askStateDispatchBase>>(
    qpqConfig,
    askStateDispatchToFrontend,
    'Send state dispatch to UI',
    null,
    () => new Date().toISOString(),
    randomUUID,
  ),
});
