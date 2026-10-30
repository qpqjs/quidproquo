import { Action, KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';
import { WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { askAdminWebSocketBroadcast } from './askAdminWebSocketBroadcast';

const message = { type: 'hello', payload: {} };

describe('askAdminWebSocketBroadcast', () => {
  it('sends the message only to logged-in connections, across every page', () => {
    const sentTo: string[] = [];
    const scanKeys: Array<string | undefined> = [];

    runStory(askAdminWebSocketBroadcast(message), {
      [KeyValueStoreActionType.Scan]: (action: Action<any>) => {
        scanKeys.push(action.payload.nextPageKey);
        return scanKeys.length === 1
          ? { items: [{ id: 'c1', userId: 'u1' }, { id: 'c2' }], nextPageKey: 'page-2' }
          : { items: [{ id: 'c3', userId: 'u3' }], nextPageKey: undefined };
      },
      [WebsocketActionType.SendMessage]: (action: Action<any>) => {
        sentTo.push(action.payload.connectionId);
        expect(action.payload.payload).toEqual(message);
      },
    });

    expect(scanKeys).toEqual([undefined, 'page-2']);
    expect(sentTo).toEqual(['c1', 'c3']);
  });
});
