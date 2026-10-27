import { WebSocketQueueEvent, WebSocketQueueEventMessage } from '../../../../../webSocketQueue';
import { WebsocketAdminClientMessageEventType } from './WebSocketQueueQpqAdminClientMessageEventType';

export type WebSocketQueueClientEventPayloadQpqAdminConfigSyncRequest = {};

export type WebSocketQueueClientEventMessageQpqAdminConfigSyncRequest = WebSocketQueueEventMessage<
  WebSocketQueueClientEventPayloadQpqAdminConfigSyncRequest,
  WebsocketAdminClientMessageEventType.ConfigSyncRequest
>;

export type WebSocketQueueQpqAdminConfigSyncRequestQueueEvent = WebSocketQueueEvent<
  WebsocketAdminClientMessageEventType.ConfigSyncRequest,
  WebSocketQueueClientEventPayloadQpqAdminConfigSyncRequest
>;
