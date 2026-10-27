import { KeyValueStoreActionType, runStory } from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { askWebSocketQueueBroadcastMessage } from './askWebSocketQueueBroadcastMessage';

describe('askWebSocketQueueBroadcastMessage', () => {
  it('sends the message to every connection using the given api name', () => {
    const sends: any[] = [];

    runStory(askWebSocketQueueBroadcastMessage('demo', { type: 'some-event' } as any), {
      [KeyValueStoreActionType.Scan]: { items: [{ id: 'a' }, { id: 'b' }] },
      [WebsocketActionType.SendMessage]: (action: any) => {
        sends.push(action.payload);
        return undefined;
      },
    });

    expect(sends.map((send) => send.connectionId)).toEqual(['a', 'b']);
    expect(sends.map((send) => send.websocketApiName)).toEqual(['demo', 'demo']);
  });
});
