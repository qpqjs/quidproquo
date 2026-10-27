import { AskResponse, createActionRequester } from 'quidproquo-core';

import { WebsocketActionType } from './WebsocketActionType';

export const askWebsocketSendMessageBase = createActionRequester<void>()({
  actionType: WebsocketActionType.SendMessage,
  errorTypes: ['Throttled', 'Disconnected'],
  getPayload: (websocketApiName: string, connectionId: string, payload: unknown) => ({ websocketApiName, connectionId, payload }),
});

// Generic so callers can pin the message body shape at the call site.
export function* askWebsocketSendMessage<T>(websocketApiName: string, connectionId: string, payload: T): AskResponse<void> {
  return yield* askWebsocketSendMessageBase(websocketApiName, connectionId, payload);
}
