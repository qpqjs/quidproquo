import { AnyEventMessage, askCatch } from 'quidproquo-core';
import { askWebsocketSendMessage } from 'quidproquo-webserver';

export function* askSendMessage<E extends AnyEventMessage>(connectionId: string, payload: E) {
  yield* askCatch(askWebsocketSendMessage('qpqadmin', connectionId, payload));
}
