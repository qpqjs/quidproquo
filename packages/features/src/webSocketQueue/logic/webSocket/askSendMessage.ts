import { AskResponse } from '@qpqjs/core';
import { askWebsocketSendMessage } from '@qpqjs/webserver';

import { askWebsocketApiNameReadOrThrow } from '../../context';
import { AnyWebSocketQueueEventMessage } from '../../types/AnyWebSocketQueueEventMessage';

export function* askSendMessage<E extends AnyWebSocketQueueEventMessage>(connectionId: string, payload: E): AskResponse<void> {
  const apiName = yield* askWebsocketApiNameReadOrThrow();

  yield* askWebsocketSendMessage(apiName, connectionId, payload);
}
