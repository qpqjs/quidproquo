import { describe, expect, it } from 'vitest';

import { WebSocketQueueServerMessageEventType } from './WebSocketQueueServerMessageEventType';

describe('WebSocketQueueServerMessageEventType', () => {
  it('names each server message event with its namespaced value', () => {
    expect(WebSocketQueueServerMessageEventType.Authenticated).toBe('Qpq/WebSocketQueue/Authenticated');
    expect(WebSocketQueueServerMessageEventType.EventDocHeadMoved).toBe('Qpq/WebSocketQueue/EventDocHeadMoved');
    expect(WebSocketQueueServerMessageEventType.Maintenance).toBe('Qpq/WebSocketQueue/Maintenance');
    expect(WebSocketQueueServerMessageEventType.Pong).toBe('Qpq/WebSocketQueue/Pong');
    expect(WebSocketQueueServerMessageEventType.ServiceRequestResponse).toBe('Qpq/WebSocketQueue/ServiceRequestResponse');
    expect(WebSocketQueueServerMessageEventType.ServiceUpdated).toBe('Qpq/WebSocketQueue/ServiceUpdated');
    expect(WebSocketQueueServerMessageEventType.StateDispatch).toBe('Qpq/WebSocketQueue/StateDispatch');
    expect(WebSocketQueueServerMessageEventType.Unauthenticated).toBe('Qpq/WebSocketQueue/Unauthenticated');
  });

  it('exposes exactly the eight server message events', () => {
    expect(Object.values(WebSocketQueueServerMessageEventType)).toEqual([
      'Qpq/WebSocketQueue/Authenticated',
      'Qpq/WebSocketQueue/EventDocHeadMoved',
      'Qpq/WebSocketQueue/Maintenance',
      'Qpq/WebSocketQueue/Pong',
      'Qpq/WebSocketQueue/ServiceRequestResponse',
      'Qpq/WebSocketQueue/ServiceUpdated',
      'Qpq/WebSocketQueue/StateDispatch',
      'Qpq/WebSocketQueue/Unauthenticated',
    ]);
  });
});
