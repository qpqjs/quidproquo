import { KeyValueStoreActionType, runStory } from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { WebSocketQueueServerMessageEventType } from '../../types/serverMessages/WebSocketQueueServerMessageEventType';
import { askWebSocketQueueBroadcastServiceUpdated } from './askWebSocketQueueBroadcastServiceUpdated';

describe('askWebSocketQueueBroadcastServiceUpdated', () => {
  it('broadcasts a ServiceUpdated message carrying the service name', () => {
    const sends: any[] = [];

    runStory(askWebSocketQueueBroadcastServiceUpdated('demo', 'template'), {
      [KeyValueStoreActionType.Scan]: { items: [{ id: 'a' }] },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload.payload);
        return undefined;
      },
    });

    expect(sends).toEqual([
      {
        type: WebSocketQueueServerMessageEventType.ServiceUpdated,
        payload: { serviceName: 'template' },
      },
    ]);
  });
});
