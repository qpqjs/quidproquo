import { WebSocketQueueEvent, WebSocketQueueEventMessage } from '../../../../../webSocketQueue';
import { WebsocketAdminClientMessageEventType } from './WebSocketQueueQpqAdminClientMessageEventType';

/** An admin's request to reproject every event doc: it names nothing, since every service reprojects the collections it owns. */
export type WebSocketQueueClientEventPayloadQpqAdminEventDocReprojectRequest = Record<string, never>;

/** The reproject request as the admin client sends it. */
export type WebSocketQueueClientEventMessageQpqAdminEventDocReprojectRequest = WebSocketQueueEventMessage<
  WebSocketQueueClientEventPayloadQpqAdminEventDocReprojectRequest,
  WebsocketAdminClientMessageEventType.EventDocReprojectRequest
>;

/** The reproject request as each service's admin queue receives it. */
export type WebSocketQueueQpqAdminEventDocReprojectRequestQueueEvent = WebSocketQueueEvent<
  WebsocketAdminClientMessageEventType.EventDocReprojectRequest,
  WebSocketQueueClientEventPayloadQpqAdminEventDocReprojectRequest
>;
