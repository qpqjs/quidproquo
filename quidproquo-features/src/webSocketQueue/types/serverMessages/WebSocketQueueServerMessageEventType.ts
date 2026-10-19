export enum WebSocketQueueServerMessageEventType {
  Authenticated = 'Qpq/WebSocketQueue/Authenticated',
  EventDocHeadMoved = 'Qpq/WebSocketQueue/EventDocHeadMoved',
  Maintenance = 'Qpq/WebSocketQueue/Maintenance',
  Pong = 'Qpq/WebSocketQueue/Pong',
  ServiceRequestResponse = 'Qpq/WebSocketQueue/ServiceRequestResponse',
  ServiceUpdated = 'Qpq/WebSocketQueue/ServiceUpdated',
  StateDispatch = 'Qpq/WebSocketQueue/StateDispatch',
  Unauthenticated = 'Qpq/WebSocketQueue/Unauthenticated',
}
