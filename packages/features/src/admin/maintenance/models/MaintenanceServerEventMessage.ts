import { WebSocketQueueServerMessageEventType } from '../../../webSocketQueue/types/serverMessages/WebSocketQueueServerMessageEventType';
import { WebSocketQueueEventMessage } from '../../../webSocketQueue/types/WebSocketQueueEventMessage';
import { MaintenancePublicState } from '../eventDoc/MaintenancePublicState';

// The authoritative set of ACTIVE maintenances, pushed to every connection on any
// maintenance mutation and to each connection as it opens (pre-auth). An empty array
// clears — the frontend replaces its whole maintenance state with this payload,
// never merges.
export type MaintenanceServerEventPayload = {
  maintenances: MaintenancePublicState[];
};

export type MaintenanceServerEventMessage = WebSocketQueueEventMessage<
  MaintenanceServerEventPayload,
  WebSocketQueueServerMessageEventType.Maintenance
>;
