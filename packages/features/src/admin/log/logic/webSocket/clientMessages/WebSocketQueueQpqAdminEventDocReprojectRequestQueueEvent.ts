import { EventDocReprojectSource } from '../../../../../eventDoc/models/EventDocReprojectSource';
import { WebSocketQueueEvent, WebSocketQueueEventMessage } from '../../../../../webSocketQueue';
import { WebsocketAdminClientMessageEventType } from './WebSocketQueueQpqAdminClientMessageEventType';

/**
 * An admin's request to reproject every event doc. It names no collection, since every service reprojects the ones it
 * owns. `source` says where each walk finds its documents; absent means the lists store.
 */
export type WebSocketQueueClientEventPayloadQpqAdminEventDocReprojectRequest = {
  source?: EventDocReprojectSource;
};

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
