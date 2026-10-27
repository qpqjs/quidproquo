import { WebSocketQueueEvent, WebSocketQueueEventMessage } from '../../../../../webSocketQueue';
import { WebsocketAdminClientMessageEventType } from './WebSocketQueueQpqAdminClientMessageEventType';

export type WebSocketQueueClientEventPayloadQpqAdminRefreshLogMetadata = {
  correlationId: string;
};

export type WebSocketQueueClientEventMessageQpqAdminRefreshLogMetadata = WebSocketQueueEventMessage<
  WebSocketQueueClientEventPayloadQpqAdminRefreshLogMetadata,
  WebsocketAdminClientMessageEventType.RefreshLogMetadata
>;

export type WebSocketQueueQpqAdminRefreshLogMetadataQueueEvent = WebSocketQueueEvent<
  WebsocketAdminClientMessageEventType.RefreshLogMetadata,
  WebSocketQueueClientEventPayloadQpqAdminRefreshLogMetadata
>;
