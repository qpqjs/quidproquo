import {
  AiModel,
  ConfigActionType,
  ContextActionType,
  KeyValueStoreActionType,
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
  EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL,
  EVENT_DOC_AI_SEND_USAGE_TO_FRONTEND_GLOBAL,
  EVENT_DOC_AI_SERVICE_NAME_GLOBAL,
} from '../../constants/eventDocAiGlobalNames';
import type { EventDocAiChatHistoryResult } from '../../models';
import { EventDocAiChatRowDataType } from '../../models/EventDocAiChatRowDataType';
import { EventDocAiChatRowKind } from '../../models/EventDocAiChatRowKind';
import { onChatHistory } from './onChatHistory';

// Newest first, as the store returns a page.
const storedRows = [
  {
    pk: 'corr-1#chat-1',
    sk: 'row-2',
    messageId: 'row-2',
    role: 'assistant',
    model: AiModel.ClaudeSonnet46,
    kind: EventDocAiChatRowKind.Text,
    data: { type: EventDocAiChatRowDataType.Inline, content: 'Hello.' },
  },
  {
    pk: 'corr-1#chat-1',
    sk: 'row-1',
    messageId: 'row-1',
    role: 'user',
    kind: EventDocAiChatRowKind.Text,
    data: { type: EventDocAiChatRowDataType.Inline, content: 'Hi' },
  },
];

const readContextByIdentifier = (action: { payload: { contextIdentifier: { uniqueName: string; defaultValue: unknown } } }) =>
  action.payload.contextIdentifier.uniqueName === websocketConnectionInfoContext.uniqueName
    ? { apiName: 'ws-api', connectionId: 'conn-1', correlationId: 'ws-corr-1' }
    : action.payload.contextIdentifier.defaultValue;

// Serves one page of a chat's history and returns the query it made and what the websocket carried.
const serveHistory = ({ sendUsageToFrontend = false, before }: { sendUsageToFrontend?: boolean; before?: string } = {}) => {
  const globals: Record<string, unknown> = {
    [EVENT_DOC_AI_SERVICE_NAME_GLOBAL]: 'log',
    [EVENT_DOC_TYPE_GLOBAL]: 'log',
    [EVENT_DOC_USER_DIRECTORY_GLOBAL]: 'admin-users',
    [EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL]: 'chat-rows',
    [EVENT_DOC_AI_SEND_USAGE_TO_FRONTEND_GLOBAL]: sendUsageToFrontend,
  };
  const sentMessages: { payload: { result: EventDocAiChatHistoryResult } }[] = [];
  const queries: { keyValueStoreName: string; keyCondition: unknown; options: Record<string, unknown> }[] = [];

  const event: QueueEvent<QueueMessage<any>> = {
    id: 'q-1',
    message: { payload: { chatId: 'chat-1', docId: 'corr-1', ...(before ? { before } : {}) } } as QueueMessage<any>,
  };

  runStory(onChatHistory(event), {
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => globals[action.payload.globalName] ?? '',
    [UserDirectoryActionType.ReadAccessToken]: { userId: 'user-1', username: 'joe' },
    [ContextActionType.Read]: readContextByIdentifier,
    [KeyValueStoreActionType.Query]: (action: { payload: (typeof queries)[number] }) => {
      queries.push(action.payload);
      return { items: storedRows, nextPageKey: undefined };
    },
    [WebsocketActionType.SendMessage]: (action: { payload: { payload: { payload: { result: EventDocAiChatHistoryResult } } } }) => {
      sentMessages.push(action.payload.payload);
    },
  });

  expect(sentMessages).toHaveLength(1);
  expect(queries).toHaveLength(1);

  return { response: sentMessages[0]!.payload.result, query: queries[0]! };
};

describe('onChatHistory', () => {
  it('answers with one page of rows, oldest first, without their storage key', () => {
    const { response } = serveHistory();

    expect(response).toEqual({
      rows: [
        {
          sk: 'row-1',
          messageId: 'row-1',
          role: 'user',
          kind: EventDocAiChatRowKind.Text,
          data: { type: EventDocAiChatRowDataType.Inline, content: 'Hi' },
        },
        {
          sk: 'row-2',
          messageId: 'row-2',
          role: 'assistant',
          model: AiModel.ClaudeSonnet46,
          kind: EventDocAiChatRowKind.Text,
          data: { type: EventDocAiChatRowDataType.Inline, content: 'Hello.' },
        },
      ],
      hasMore: false,
    });
  });

  // Security regression: the chat id comes from the caller; the document id is the one the request was authorised for.
  it('reads the chat through the document the request was authorised for', () => {
    expect(serveHistory().query).toEqual(
      expect.objectContaining({ keyValueStoreName: 'chat-rows', keyCondition: expect.objectContaining({ key: 'pk', valueA: 'corr-1#chat-1' }) }),
    );
  });

  it('reads the page before a row when asked for older rows', () => {
    expect(serveHistory({ before: 'row-1' }).query.keyCondition).toEqual({
      operation: expect.anything(),
      conditions: [
        expect.objectContaining({ key: 'pk', valueA: 'corr-1#chat-1' }),
        expect.objectContaining({ key: 'sk', operation: 'LessThan', valueA: 'row-1' }),
      ],
    });
  });

  // Security regression: usage rows are left out by the query itself, so they are never read into a page.
  it('filters usage rows out at the store unless the chat lets usage through', () => {
    expect(serveHistory().query.options.filter).toEqual(
      expect.objectContaining({ key: 'kind', operation: 'NotEqual', valueA: EventDocAiChatRowKind.Usage }),
    );
    expect(serveHistory({ sendUsageToFrontend: true }).query.options.filter).toBeUndefined();
  });
});
