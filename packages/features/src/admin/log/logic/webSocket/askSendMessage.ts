import { AnyEventMessage, askCatch } from '@qpqjs/core';
import { askWebsocketSendMessage } from '@qpqjs/webserver';

import { ADMIN_WEBSOCKET_API_NAME } from '../../../constants';

export function* askSendMessage<E extends AnyEventMessage>(connectionId: string, payload: E) {
  yield* askCatch(askWebsocketSendMessage(ADMIN_WEBSOCKET_API_NAME, connectionId, payload));
}
