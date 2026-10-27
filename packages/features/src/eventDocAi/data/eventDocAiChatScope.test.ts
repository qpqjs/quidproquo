import {
  AskResponse,
  askStorageScopeProvide,
  ConfigActionType,
  DateActionType,
  FileActionType,
  KeyValueStoreActionType,
  runStory,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_AI_CHAT_DRIVE_GLOBAL, EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL } from '../constants/eventDocAiGlobalNames';
import { askEventDocAiAttachmentsValidate } from '../logic/askEventDocAiAttachmentsValidate';
import type { EventDocAiChatSummary } from '../models';
import { askEventDocAiChatHistoryLoad } from './askEventDocAiChatHistoryLoad';
import { askEventDocAiChatHistorySave } from './askEventDocAiChatHistorySave';
import { askEventDocAiChatList } from './askEventDocAiChatList';
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
  [EVENT_DOC_AI_CHAT_DRIVE_GLOBAL]: 'chat-drive',
  [EVENT_DOC_AI_CHAT_LIST_STORE_GLOBAL]: 'chat-list',
};

// Exercises every storage site in one pass: history save/load (file write,
// exists, read), list + touch (queries + upsert), upsert, attachment check.
function* askRunAllChatStorageFns(): AskResponse<void> {
  yield* askEventDocAiChatHistorySave('doc-1', 'chat-1', []);
  yield* askEventDocAiChatHistoryLoad('doc-1', 'chat-1');
  yield* askEventDocAiChatList('doc-1');
  yield* askEventDocAiChatUpsert(chat);
  yield* askEventDocAiChatTouch('doc-1', 'chat-1');
  yield* askEventDocAiAttachmentsValidate('doc-drive', 'doc-1', [{ assetId: 'a1', filename: 'a.png', mediaType: 'image/png' }]);
}

// 8 storage actions total: write, exists, read, query, upsert, query, upsert, exists.
const EXPECTED_STORAGE_ACTION_COUNT = 8;

const buildMocks = (seenScopes: (string | undefined)[]) => ({
  [ConfigActionType.GetGlobal]: (action: any) => globals[action.payload.globalName] ?? '',
  [DateActionType.Now]: '2026-07-12T00:00:00.000Z',
  [FileActionType.WriteObjectJson]: (action: any) => {
    seenScopes.push(action.payload.scope);
    return undefined;
  },
  [FileActionType.Exists]: (action: any) => {
    seenScopes.push(action.payload.scope);
    return true;
  },
  [FileActionType.ReadObjectJson]: (action: any) => {
    seenScopes.push(action.payload.scope);
    return { messages: [] };
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
