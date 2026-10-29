import { Action, KeyValueStoreActionType, runStory, StoryResultMetadata } from '@qpqjs/core';
import { WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { askSendLogToAdmins } from './askSendLogToAdmins';
import { WebSocketQueueQpqAdminServerMessageEventType } from './serverMessages';

const log = { correlation: 'abc' } as StoryResultMetadata;

describe('askSendLogToAdmins', () => {
  it('sends the log only to authorized (userId) connections', () => {
    const sentTo: string[] = [];
    let sentMessage: any;

    runStory(askSendLogToAdmins(log), {
      [KeyValueStoreActionType.Scan]: {
        items: [{ id: 'c1', userId: 'u1' }, { id: 'c2' }],
        nextPageKey: undefined,
      },
      [WebsocketActionType.SendMessage]: (action: Action<any>) => {
        sentTo.push(action.payload.connectionId);
        sentMessage = action.payload.payload;
      },
    });

    expect(sentTo).toEqual(['c1']);
    expect(sentMessage).toEqual({
      type: WebSocketQueueQpqAdminServerMessageEventType.LogMetadata,
      payload: { log },
    });
  });

  it('sends nothing when there are no connections', () => {
    let sent = false;

    runStory(askSendLogToAdmins(log), {
      [KeyValueStoreActionType.Scan]: { items: [], nextPageKey: undefined },
      [WebsocketActionType.SendMessage]: () => {
        sent = true;
      },
    });

    expect(sent).toBe(false);
  });

  it('walks every page of connections, passing the page key forward', () => {
    const sentTo: string[] = [];
    const scanKeys: Array<string | undefined> = [];

    runStory(askSendLogToAdmins(log), {
      [KeyValueStoreActionType.Scan]: (action: Action<any>) => {
        scanKeys.push(action.payload.nextPageKey);
        return scanKeys.length === 1
          ? { items: [{ id: 'c1', userId: 'u1' }], nextPageKey: 'page-2' }
          : { items: [{ id: 'c2', userId: 'u2' }], nextPageKey: undefined };
      },
      [WebsocketActionType.SendMessage]: (action: Action<any>) => {
        sentTo.push(action.payload.connectionId);
      },
    });

    expect(scanKeys).toEqual([undefined, 'page-2']);
    expect(sentTo).toEqual(['c1', 'c2']);
  });
});
