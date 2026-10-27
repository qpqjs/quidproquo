import { AnyEventMessage, askCatch } from '@qpqjs/core';
import { askWebsocketSendMessage } from '@qpqjs/webserver';

export function* askSendMessage<E extends AnyEventMessage>(connectionId: string, payload: E) {
  yield* askCatch(askWebsocketSendMessage('qpqadmin', connectionId, payload));
}
