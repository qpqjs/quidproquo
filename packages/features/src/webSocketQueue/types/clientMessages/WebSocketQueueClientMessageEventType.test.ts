import { describe, expect, it } from 'vitest';

import { WebSocketQueueClientMessageEventType } from './WebSocketQueueClientMessageEventType';

describe('WebSocketQueueClientMessageEventType', () => {
  it('names each client message event with its namespaced value', () => {
    expect(WebSocketQueueClientMessageEventType.Authenticate).toBe('Qpq/WebSocketQueue/Authenticate');
    expect(WebSocketQueueClientMessageEventType.Unauthenticate).toBe('Qpq/WebSocketQueue/Unauthenticate');
    expect(WebSocketQueueClientMessageEventType.Ping).toBe('Qpq/WebSocketQueue/Ping');
    expect(WebSocketQueueClientMessageEventType.Subscribe).toBe('Qpq/WebSocketQueue/Subscribe');
    expect(WebSocketQueueClientMessageEventType.Unsubscribe).toBe('Qpq/WebSocketQueue/Unsubscribe');
  });

  it('exposes exactly the five client message events', () => {
    expect(Object.values(WebSocketQueueClientMessageEventType)).toEqual([
      'Qpq/WebSocketQueue/Authenticate',
      'Qpq/WebSocketQueue/Unauthenticate',
      'Qpq/WebSocketQueue/Ping',
      'Qpq/WebSocketQueue/Subscribe',
      'Qpq/WebSocketQueue/Unsubscribe',
    ]);
  });
});
