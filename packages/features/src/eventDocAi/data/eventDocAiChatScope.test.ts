import { AskResponse, askStorageScopeProvide, ConfigActionType, DateActionType, FileActionType, KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import {
  EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL,
  EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL,
  EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL,
} from '../constants/eventDocAiGlobalNames';
import { askEventDocAiAttachmentsValidate } from '../logic/askEventDocAiAttachmentsValidate';
import type { EventDocAiChatRow, EventDocAiChatSummary } from '../models';
import { EventDocAiChatRowDataType } from '../models/EventDocAiChatRowDataType';
import { EventDocAiChatRowKind } from '../models/EventDocAiChatRowKind';
import { askEventDocAiChatList } from './askEventDocAiChatList';
import { askEventDocAiChatRowContentRead } from './askEventDocAiChatRowContentRead';
import { askEventDocAiChatRowContentUrl } from './askEventDocAiChatRowContentUrl';
import { askEventDocAiChatRowContentWrite } from './askEventDocAiChatRowContentWrite';
import { askEventDocAiChatRowGet } from './askEventDocAiChatRowGet';
import { askEventDocAiChatRowsQueryAll } from './askEventDocAiChatRowsQueryAll';
import { askEventDocAiChatRowsQueryPage } from './askEventDocAiChatRowsQueryPage';
import { askEventDocAiChatRowsWrite } from './askEventDocAiChatRowsWrite';
import { askEventDocAiChatTouch } from './askEventDocAiChatTouch';
import { askEventDocAiChatUpsert } from './askEventDocAiChatUpsert';

// Proves every eventDocAi storage site forwards the ambient storage scope: run
// all the chat data fns once and record the scope each File/KVS action carried.
// Scoped run = all 'tenant-a'; unscoped run = all undefined.

const chat: EventDocAiChatSummary = {
  docId: 'doc-1',
  chatId: 'chat-1',
  name: 'chat',
  createdAt: '2026-07-12T00:00:00.000Z',
  updatedAt: '2026-07-12T00:00:00.000Z',
  createdByUserId: 'u1',
};

const globals: Record<string, string> = {
  [EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL]: 'chat-blobs',
  [EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL]: 'chat-list',
  [EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL]: 'chat-rows',
};

const row: EventDocAiChatRow = {
  sk: 'row-1',
  messageId: 'row-1',
  role: 'user',
  kind: EventDocAiChatRowKind.Text,
  data: { type: EventDocAiChatRowDataType.Inline, content: 'Hi' },
};

// Exercises every storage site in one pass: the rows (write, read all, read a page, read one), a row's stored content
// (write, read, link), the chat list (list, upsert, touch) and the attachment check.
function* askRunAllChatStorageFns(): AskResponse<void> {
  yield* askEventDocAiChatRowsWrite('doc-1', 'chat-1', [row]);
  yield* askEventDocAiChatRowsQueryAll('doc-1', 'chat-1');
  yield* askEventDocAiChatRowsQueryPage('doc-1', 'chat-1', { includeUsage: false });
  yield* askEventDocAiChatRowGet('doc-1', 'chat-1', 'row-1');
  yield* askEventDocAiChatRowContentWrite('doc-1', 'chat-1', 'row-1', 'a long text');
  yield* askEventDocAiChatRowContentRead('doc-1', 'chat-1', 'row-1');
  yield* askEventDocAiChatRowContentUrl('doc-1', 'chat-1', 'row-1');
  yield* askEventDocAiChatList('doc-1');
  yield* askEventDocAiChatUpsert(chat);
  yield* askEventDocAiChatTouch('doc-1', 'chat-1');
  yield* askEventDocAiAttachmentsValidate('doc-drive', 'doc-1', [{ assetId: 'a1', filename: 'a.png', mediaType: 'image/png' }]);
}

// 12 storage actions total: upsert many, query x3, file write, read, link, query, upsert, query, upsert, exists.
const EXPECTED_STORAGE_ACTION_COUNT = 12;

const buildMocks = (seenScopes: (string | undefined)[]) => ({
  [ConfigActionType.GetGlobal]: (action: any) => globals[action.payload.globalName] ?? '',
  [DateActionType.Now]: '2026-07-12T00:00:00.000Z',
  [FileActionType.WriteObjectJson]: (action: any) => {
    seenScopes.push(action.payload.scope);
    return undefined;
  },
  [FileActionType.GenerateTemporarySecureUrl]: (action: any) => {
    seenScopes.push(action.payload.scope);
    return 'https://files.example/value.json';
  },
  [KeyValueStoreActionType.UpsertMany]: (action: any) => {
    seenScopes.push(action.payload.options?.scope);
    return undefined;
  },
  [FileActionType.Exists]: (action: any) => {
    seenScopes.push(action.payload.scope);
    return true;
  },
  [FileActionType.ReadObjectJson]: (action: any) => {
    seenScopes.push(action.payload.scope);
    return { content: 'x' };
  },
  [KeyValueStoreActionType.Query]: (action: any) => {
    seenScopes.push(action.payload.options?.scope);
    return { items: [chat], nextPageKey: undefined };
  },
  [KeyValueStoreActionType.Upsert]: (action: any) => {
    seenScopes.push(action.payload.options?.scope);
    return undefined;
  },
});

describe('eventDocAi chat storage scope forwarding', () => {
  it('forwards the ambient storage scope to every File/KVS action', () => {
    const seenScopes: (string | undefined)[] = [];

    runStory(askStorageScopeProvide('tenant-a', askRunAllChatStorageFns()), buildMocks(seenScopes));

    expect(seenScopes).toEqual(Array(EXPECTED_STORAGE_ACTION_COUNT).fill('tenant-a'));
  });

  it('carries no scope when no ambient storage scope is provided', () => {
    const seenScopes: (string | undefined)[] = [];

    runStory(askRunAllChatStorageFns(), buildMocks(seenScopes));

    expect(seenScopes).toHaveLength(EXPECTED_STORAGE_ACTION_COUNT);
    expect(seenScopes.every((scope) => scope === undefined)).toBe(true);
  });
});
