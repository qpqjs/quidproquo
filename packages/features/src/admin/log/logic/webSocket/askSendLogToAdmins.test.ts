import { Action, KeyValueStoreActionType, runStory, StoryResultMetadata } from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

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
});
