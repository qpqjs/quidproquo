import {
  ConfigActionType,
  ContextActionType,
  DateActionType,
  GuidActionType,
  KeyValueStoreActionType,
  QueueEvent,
  QueueMessage,
  runStory,
  UserDirectoryActionType,
} from 'quidproquo-core';
import { WebsocketActionType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_TYPE_GLOBAL, EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../../../eventDoc';
import { websocketConnectionInfoContext } from '../../../webSocketQueue/context';
import { EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL, EVENT_DOC_AI_SERVICE_NAME_GLOBAL } from '../../constants/eventDocAiGlobalNames';
import { onChatCreate } from './onChatCreate';

let sortableGuidCount = 0;

const globals: Record<string, string> = {
  [EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL]: 'logAiChats',
  [EVENT_DOC_AI_SERVICE_NAME_GLOBAL]: 'log',
  [EVENT_DOC_TYPE_GLOBAL]: 'log',
  [EVENT_DOC_USER_DIRECTORY_GLOBAL]: 'admin-users',
};

// Answer only the ws connection-info read; every other context read (e.g. the
// storage scope) falls back to its identifier's default, like the runtime does.
const readContextByIdentifier = (action: { payload: { contextIdentifier: { uniqueName: string; defaultValue: unknown } } }) =>
  action.payload.contextIdentifier.uniqueName === websocketConnectionInfoContext.uniqueName
    ? { apiName: 'ws-api', connectionId: 'conn-1', correlationId: 'ws-corr-1' }
    : action.payload.contextIdentifier.defaultValue;

describe('onChatCreate', () => {
  it('creates and stores a chat scoped to the trusted docId, then responds over the websocket', () => {
    const upserts: { keyValueStoreName: string; item: unknown }[] = [];
    const sentMessages: unknown[] = [];

    const event: QueueEvent<QueueMessage<any>> = {
      id: 'q-1',
      message: { payload: { name: 'New chat', docId: 'corr-1' } } as QueueMessage<any>,
    };

    runStory(onChatCreate(event), {
      [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => globals[action.payload.globalName] ?? '',
      [UserDirectoryActionType.ReadAccessToken]: { userId: 'user-1', username: 'joe' },
      [GuidActionType.New]: 'chat-1',
      // Sortable ids must sort lexicographically in creation order; pad so they do.
      [GuidActionType.NewSortable]: () => `sguid-${String(++sortableGuidCount).padStart(4, '0')}`,
      [DateActionType.Now]: '2026-07-11T00:00:00.000Z',
      [KeyValueStoreActionType.Upsert]: (action: { payload: { keyValueStoreName: string; item: unknown } }) => {
        upserts.push({ keyValueStoreName: action.payload.keyValueStoreName, item: action.payload.item });
      },
      [ContextActionType.Read]: readContextByIdentifier,
      [WebsocketActionType.SendMessage]: (action: { payload: { payload: unknown } }) => {
        sentMessages.push(action.payload.payload);
      },
    });

    expect(upserts).toEqual([
      {
        keyValueStoreName: 'logAiChats',
        item: {
          docId: 'corr-1',
          chatId: 'chat-1',
          name: 'New chat',
          createdAt: '2026-07-11T00:00:00.000Z',
          updatedAt: '2026-07-11T00:00:00.000Z',
          createdByUserId: 'user-1',
        },
      },
    ]);

    expect(sentMessages).toHaveLength(1);
    expect((sentMessages[0] as { payload: { success: boolean; result: { docId: string; chatId: string } } }).payload).toEqual(
      expect.objectContaining({ success: true, result: expect.objectContaining({ docId: 'corr-1', chatId: 'chat-1' }) }),
    );
  });
});
