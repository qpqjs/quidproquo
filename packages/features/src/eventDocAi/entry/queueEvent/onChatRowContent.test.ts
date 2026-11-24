import {
  ConfigActionType,
  ContextActionType,
  FileActionType,
  KeyValueStoreActionType,
  LogActionType,
  QueueEvent,
  QueueMessage,
  UserDirectoryActionType,
} from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';
import { WebsocketActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_TYPE_GLOBAL, EVENT_DOC_USER_DIRECTORY_GLOBAL } from '../../../eventDoc';
import { websocketConnectionInfoContext } from '../../../webSocketQueue/context';
import {
  EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL,
  EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL,
  EVENT_DOC_AI_SERVICE_NAME_GLOBAL,
} from '../../constants/eventDocAiGlobalNames';
import { EventDocAiChatRowDataType } from '../../models/EventDocAiChatRowDataType';
import { EventDocAiChatRowKind } from '../../models/EventDocAiChatRowKind';
import { onChatRowContent } from './onChatRowContent';

const toolRow = (data: unknown) => ({
  pk: 'corr-1#chat-1',
  sk: 'row-1',
  messageId: 'row-1',
  role: 'assistant',
  kind: EventDocAiChatRowKind.ToolUse,
  toolName: 'renderDocument',
  data,
});

const readContextByIdentifier = (action: { payload: { contextIdentifier: { uniqueName: string; defaultValue: unknown } } }) =>
  action.payload.contextIdentifier.uniqueName === websocketConnectionInfoContext.uniqueName
    ? { apiName: 'ws-api', connectionId: 'conn-1', correlationId: 'ws-corr-1' }
    : action.payload.contextIdentifier.defaultValue;

// Asks for the link to one row's stored content and returns what the websocket carried, the lookup made and the files a link was made for.
const serveContent = (storedRows: unknown[]) => {
  const globals: Record<string, unknown> = {
    [EVENT_DOC_AI_SERVICE_NAME_GLOBAL]: 'log',
    [EVENT_DOC_TYPE_GLOBAL]: 'log',
    [EVENT_DOC_USER_DIRECTORY_GLOBAL]: 'admin-users',
    [EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL]: 'chat-rows',
    [EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL]: 'chat-blobs',
  };
  const sentMessages: { payload: { success: boolean; result?: unknown } }[] = [];
  const lookups: unknown[] = [];
  const linked: string[] = [];

  const event: QueueEvent<QueueMessage<any>> = {
    id: 'q-1',
    message: { payload: { chatId: 'chat-1', docId: 'corr-1', sk: 'row-1' } } as QueueMessage<any>,
  };

  runStory(onChatRowContent(event), {
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => globals[action.payload.globalName] ?? '',
    [UserDirectoryActionType.ReadAccessToken]: { userId: 'user-1', username: 'joe' },
    [ContextActionType.Read]: readContextByIdentifier,
    [KeyValueStoreActionType.Query]: (action: { payload: { keyCondition: unknown } }) => {
      lookups.push(action.payload.keyCondition);
      return { items: storedRows, nextPageKey: undefined };
    },
    [FileActionType.GenerateTemporarySecureUrl]: (action: { payload: { filepath: string } }) => {
      linked.push(action.payload.filepath);
      return 'https://files.example/row-1.json?signature=abc';
    },
    [LogActionType.RedactString]: undefined,
    [WebsocketActionType.SendMessage]: (action: { payload: { payload: (typeof sentMessages)[number] } }) => {
      sentMessages.push(action.payload.payload);
    },
  });

  expect(sentMessages).toHaveLength(1);

  return { response: sentMessages[0]!.payload, lookups, linked };
};

describe('onChatRowContent', () => {
  it('answers with a link to the content a row holds in storage', () => {
    const { response, linked } = serveContent([toolRow({ type: EventDocAiChatRowDataType.StorageDrive })]);

    expect(response).toEqual({ success: true, result: { url: 'https://files.example/row-1.json?signature=abc' } });
    expect(linked).toEqual(['corr-1/chat-1/row-1.json']);
  });

  // Security regression: the chat id and row id come from the caller; the document id is the one the request was authorised for.
  it('looks the row up through the document the request was authorised for', () => {
    const { lookups } = serveContent([toolRow({ type: EventDocAiChatRowDataType.StorageDrive })]);

    expect(lookups).toEqual([
      expect.objectContaining({
        conditions: [expect.objectContaining({ key: 'pk', valueA: 'corr-1#chat-1' }), expect.objectContaining({ key: 'sk', valueA: 'row-1' })],
      }),
    ]);
  });

  // Security regression: a link is only made for a file the row is known to have.
  it('refuses a row that holds its own content, and a row that does not exist', () => {
    const inline = serveContent([toolRow({ type: EventDocAiChatRowDataType.Inline, content: { input: {} } })]);
    const missing = serveContent([]);

    expect([inline.response.success, missing.response.success]).toEqual([false, false]);
    expect([...inline.linked, ...missing.linked]).toEqual([]);
  });
});
