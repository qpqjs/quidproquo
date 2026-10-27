import { WebSocketQueueEvent, WebSocketQueueEventMessage } from '../../../../../webSocketQueue';
import { WebsocketAdminClientMessageEventType } from './WebSocketQueueQpqAdminClientMessageEventType';

export type WebSocketQueueClientEventPayloadQpqAdminMarkLogChecked = {
  correlationId: string;
  checked: boolean;
};

export type WebSocketQueueClientEventMessageQpqAdminMarkLogChecked = WebSocketQueueEventMessage<
  WebSocketQueueClientEventPayloadQpqAdminMarkLogChecked,
  WebsocketAdminClientMessageEventType.MarkLogChecked
>;

export type WebSocketQueueQpqAdminMarkLogCheckedQueueEvent = WebSocketQueueEvent<
  WebsocketAdminClientMessageEventType.MarkLogChecked,
  WebSocketQueueClientEventPayloadQpqAdminMarkLogChecked
>;
