import { AskResponse, EitherActionResult } from 'quidproquo-core';

import { askWebsocketReadConnectionInfo } from '../../context';
import { WebSocketQueueServerEventMessageServiceRequestResponse } from '../../types/serverMessages/WebSocketQueueServerEventMessageServiceRequestResponse';
import { WebSocketQueueServerMessageEventType } from '../../types/serverMessages/WebSocketQueueServerMessageEventType';
import { askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend } from '../webSocket/askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend';

/**
 * Sends a service request's result to the connection and correlation in context.
 * Any execution carrying the requesting session can answer, not only the handler
 * the request first landed on.
 */
export function* askServiceRequestRespond(result: EitherActionResult<unknown>): AskResponse<void> {
  const { connectionId, correlationId } = yield* askWebsocketReadConnectionInfo();

  const response: WebSocketQueueServerEventMessageServiceRequestResponse = {
    type: WebSocketQueueServerMessageEventType.ServiceRequestResponse,
    payload: result,
  };

  yield* askSendAnyWebSocketQueueEventMessageWithCorrelationToFrontend({ ...response, correlationId }, connectionId);
}
