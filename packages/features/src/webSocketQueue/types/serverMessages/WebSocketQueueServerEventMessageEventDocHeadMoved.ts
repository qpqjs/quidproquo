import { WebSocketQueueEventMessage } from '../WebSocketQueueEventMessage';
import { WebSocketQueueServerMessageEventType } from './WebSocketQueueServerMessageEventType';

/** A document's log grew. Carries ids only, never state: the client pulls what it needs. */
export type WebSocketQueueServerEventPayloadEventDocHeadMoved = {
  storeName: string;
  type: string;
  docId: string;
  headEventId: number;
  // The client message id of the event that moved the head, so the originating client can recognise its own save.
  clientMessageId?: string;
};

export type WebSocketQueueServerEventMessageEventDocHeadMoved = WebSocketQueueEventMessage<
  WebSocketQueueServerEventPayloadEventDocHeadMoved,
  WebSocketQueueServerMessageEventType.EventDocHeadMoved
>;
