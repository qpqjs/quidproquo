import { AskResponse, askStorageScopeRead } from '@qpqjs/core';

import {
  askWebSocketQueueSendToTopic,
  buildScopedWebSocketQueueTopic,
  WebSocketQueueServerEventMessageEventDocHeadMoved,
  WebSocketQueueServerMessageEventType,
} from '../../webSocketQueue';
import { eventDocHeadMovedTopic } from '../constants/eventDocHeadMovedTopic';
import { askEventDocStoreRead } from '../context/askEventDocStoreRead';
import { EventDocEvent } from '../models';

/**
 * Tells subscribed workspaces that the document's log now ends at `event`, on every queue the collection syncs to.
 * Sent under the ambient storage scope, so only connections validated into the same scope receive it. Nothing to do
 * for a collection without `sync`. Carries ids only; the client pulls the bootstrap. Requires the store context.
 */
export function* askEventDocSendHeadMoved(docId: string, event: EventDocEvent): AskResponse<void> {
  const { storeName, type, syncWebsocketApiNames } = yield* askEventDocStoreRead();

  if (syncWebsocketApiNames.length === 0) {
    return;
  }

  const scope = yield* askStorageScopeRead();
  const message: WebSocketQueueServerEventMessageEventDocHeadMoved = {
    type: WebSocketQueueServerMessageEventType.EventDocHeadMoved,
    payload: {
      storeName,
      type,
      docId,
      headEventId: event.payload.metadata.eventId,
      clientMessageId: event.payload.metadata.clientMessageId,
    },
  };

  const topic = buildScopedWebSocketQueueTopic(scope, eventDocHeadMovedTopic(storeName, docId));

  for (const websocketApiName of syncWebsocketApiNames) {
    yield* askWebSocketQueueSendToTopic(websocketApiName, topic, message);
  }
}
