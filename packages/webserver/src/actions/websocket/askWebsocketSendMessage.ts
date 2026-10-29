import { AskResponse, createActionRequester } from '@qpqjs/core';

import { WebsocketActionType } from './WebsocketActionType';

export const askWebsocketSendMessageBase = createActionRequester<void>()({
  actionType: WebsocketActionType.SendMessage,
  errorTypes: [
    'Throttled', // the websocket service is rate limiting sends
    'Disconnected', // the connection is gone, the message was not delivered
  ],
  getPayload: (websocketApiName: string, connectionId: string, payload: unknown) => ({ websocketApiName, connectionId, payload }),
});

// Generic so callers can pin the message body shape at the call site.
export function* askWebsocketSendMessage<T>(websocketApiName: string, connectionId: string, payload: T): AskResponse<void> {
  return yield* askWebsocketSendMessageBase(websocketApiName, connectionId, payload);
}
