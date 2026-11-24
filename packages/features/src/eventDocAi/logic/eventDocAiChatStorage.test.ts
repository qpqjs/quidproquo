import {
  AiModel,
  AskResponse,
  askStorageScopeProvide,
  ConfigActionType,
  FileActionType,
  GuidActionType,
  KeyValueStoreActionType,
  LogActionType,
} from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { EVENT_DOC_AI_CHAT_PAGE_MAX_BYTES } from '../constants/eventDocAiChatPageMaxBytes';
import { EVENT_DOC_AI_CHAT_PAGE_MAX_ROWS } from '../constants/eventDocAiChatPageMaxRows';
import { EVENT_DOC_AI_CHAT_ROW_CONTENT_UNAVAILABLE_NOTICE } from '../constants/eventDocAiChatRowContentUnavailableNotice';
import { EVENT_DOC_AI_CHAT_ROW_CONTENT_URL_EXPIRY_MS } from '../constants/eventDocAiChatRowContentUrlExpiryMs';
import { EVENT_DOC_AI_CHAT_ROW_INLINE_MAX_BYTES } from '../constants/eventDocAiChatRowInlineMaxBytes';
import {
  EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL,
  EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL,
  EVENT_DOC_AI_SEND_USAGE_TO_FRONTEND_GLOBAL,
} from '../constants/eventDocAiGlobalNames';
import type { EventDocAiChatHistoryResult, EventDocAiChatMessage, EventDocAiChatRow } from '../models';
import { EventDocAiChatRowDataType } from '../models/EventDocAiChatRowDataType';
import { EventDocAiChatRowKind } from '../models/EventDocAiChatRowKind';
import { eventDocAiChatRowsBytes } from '../module/logic/eventDocAiChatRowsBytes';
import { askEventDocAiChatHistoryPage } from './askEventDocAiChatHistoryPage';
import { askEventDocAiChatMessagesAppend } from './askEventDocAiChatMessagesAppend';
import { askEventDocAiChatMessagesLoad } from './askEventDocAiChatMessagesLoad';
import { askEventDocAiChatRowContentLink } from './askEventDocAiChatRowContentLink';

type Condition = { key: string; operation: string; valueA?: unknown } | { operation: string; conditions: Condition[] };
type StoredRow = Record<string, unknown> & { pk: string; sk: string };

const matches = (row: Record<string, unknown>, condition: Condition): boolean => {
  if ('conditions' in condition) {
    return condition.conditions.every((inner) => matches(row, inner));
  }

  const value = row[condition.key];

  switch (condition.operation) {
    case 'Equal':
      return value === condition.valueA;
    case 'NotEqual':
      return value !== condition.valueA;
    case 'LessThan':
      return (value as string) < (condition.valueA as string);
    default:
      throw new Error(`the stand-in store does not know the operation ${condition.operation}`);
  }
};

// A stand-in for the rows store and the blobs drive that behaves as the real ones do where it matters here:
// rows read back in sort key order, a limit is applied before a filter, and a file is only there once written.
const createChatStorage = ({ sendUsageToFrontend = false } = {}) => {
  const rows: (StoredRow & { scope?: string })[] = [];
  const files = new Map<string, object>();
  const writes: string[] = [];
  const links: { filepath: string; expirationMs: number; scope?: string }[] = [];
  const redacted: string[] = [];
  let mintedIds = 0;

  const globals: Record<string, unknown> = {
    [EVENT_DOC_AI_CHAT_ROWS_STORE_GLOBAL]: 'chat-rows',
    [EVENT_DOC_AI_CHAT_BLOBS_DRIVE_GLOBAL]: 'chat-blobs',
    [EVENT_DOC_AI_SEND_USAGE_TO_FRONTEND_GLOBAL]: sendUsageToFrontend,
  };

  const mocks = {
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) => globals[action.payload.globalName] ?? '',
    [GuidActionType.NewSortableMany]: (action: { payload: { count: number } }) =>
      Array.from({ length: action.payload.count }, () => `row-${String(mintedIds++).padStart(5, '0')}`),
    [KeyValueStoreActionType.UpsertMany]: (action: { payload: { items: StoredRow[]; options?: { scope?: string } } }) => {
      writes.push(...action.payload.items.map((item) => `row:${item.sk}`));
      rows.push(...action.payload.items.map((item) => ({ ...item, scope: action.payload.options?.scope })));
    },
    [KeyValueStoreActionType.Query]: (action: {
      payload: { keyCondition: Condition; options?: { sortAscending?: boolean; limit?: number; filter?: Condition; scope?: string } };
    }) => {
      const { keyCondition, options } = action.payload;
      const inOrder = rows
        .filter((row) => row.scope === options?.scope && matches(row, keyCondition))
        .sort((a, b) => (a.sk < b.sk ? -1 : 1) * (options?.sortAscending === false ? -1 : 1));
      const limited = inOrder.slice(0, options?.limit ?? inOrder.length);
      const { filter } = options ?? {};

      return {
        items: (filter ? limited.filter((row) => matches(row, filter)) : limited).map(({ scope: _scope, ...row }) => row),
        nextPageKey: limited.length < inOrder.length ? 'more' : undefined,
      };
    },
    [FileActionType.WriteObjectJson]: (action: { payload: { filepath: string; data: object } }) => {
      writes.push(`file:${action.payload.filepath}`);
      files.set(action.payload.filepath, action.payload.data);
    },
    [FileActionType.ReadObjectJson]: (action: { payload: { filepath: string } }) =>
      files.get(action.payload.filepath) ?? throwsError('FileNotFound', 'no such file'),
    [FileActionType.GenerateTemporarySecureUrl]: (action: { payload: (typeof links)[number] }) => {
      links.push(action.payload);
      return `https://files.example/${action.payload.filepath}?signature=abc`;
    },
    [LogActionType.RedactString]: (action: { payload: { value: string } }) => {
      redacted.push(action.payload.value);
    },
  };

  const run = <T>(story: AskResponse<T>): T => runStory(story, mocks) as T;

  return { run, rows, files, writes, links, redacted };
};

const usage = { inputTokens: 1200, outputTokens: 40 };
const bigOutput = { html: 'x'.repeat(EVENT_DOC_AI_CHAT_ROW_INLINE_MAX_BYTES) };

const question: EventDocAiChatMessage = {
  role: 'user',
  segments: [
    { type: 'file', attachment: { assetId: 'asset-1', filename: 'brief.pdf', mediaType: 'application/pdf' } },
    { type: 'text', text: 'Add a third paragraph.' },
  ],
};

const reply: EventDocAiChatMessage = {
  role: 'assistant',
  model: AiModel.ClaudeSonnet46,
  usage,
  segments: [
    { type: 'reasoning', text: 'The document needs a paragraph.' },
    {
      type: 'tool-use',
      tools: [
        { toolName: 'readDocument', input: {}, output: { version: 3 }, toolCallId: 'call-1' },
        { toolName: 'editDocument', input: { text: 'A third paragraph.' }, output: { version: 4 }, toolCallId: 'call-2' },
      ],
    },
    { type: 'text', text: 'Added the paragraph.' },
    // A stop notice is its own text segment after the reply's text, and must stay one.
    { type: 'text', text: 'The model stopped without answering.' },
  ],
};

const { usage: _usage, ...replyWithoutUsage } = reply;

const replyWithBigOutput: EventDocAiChatMessage = {
  role: 'assistant',
  model: AiModel.ClaudeSonnet46,
  segments: [{ type: 'tool-use', tools: [{ toolName: 'renderDocument', input: { id: 'doc-1' }, output: bigOutput, toolCallId: 'call-1' }] }],
};

// Loads a chat the way the browser does: page after page, each starting before the oldest row of the last.
const loadEveryPage = (storage: ReturnType<typeof createChatStorage>, docId = 'doc-1', chatId = 'chat-1') => {
  const pages: EventDocAiChatHistoryResult[] = [];
  let before: string | undefined;

  do {
    const page = storage.run(askEventDocAiChatHistoryPage(docId, chatId, before));
    pages.push(page);
    before = page.hasMore ? page.rows[0]?.sk : undefined;
  } while (before !== undefined);

  return pages;
};

describe('event doc ai chat storage', () => {
  it('reads a chat back for the model as the messages it was saved from, without usage', () => {
    const storage = createChatStorage();

    storage.run(askEventDocAiChatMessagesAppend('doc-1', 'chat-1', [question]));
    storage.run(askEventDocAiChatMessagesAppend('doc-1', 'chat-1', [reply]));

    expect(storage.run(askEventDocAiChatMessagesLoad('doc-1', 'chat-1'))).toEqual([question, replyWithoutUsage]);
  });

  it('saves a message one row per piece, each small enough to send, with nothing on the blobs drive', () => {
    const storage = createChatStorage();

    storage.run(askEventDocAiChatMessagesAppend('doc-1', 'chat-1', [question, reply]));

    expect(storage.rows.map((row) => [row.role, row.kind])).toEqual([
      ['user', 'file'],
      ['user', 'text'],
      ['assistant', 'reasoning'],
      ['assistant', 'toolUse'],
      ['assistant', 'toolUse'],
      ['assistant', 'text'],
      ['assistant', 'text'],
      ['assistant', 'usage'],
    ]);
    expect(new Set(storage.rows.map((row) => row.messageId)).size).toBe(2);
    expect(storage.files.size).toBe(0);
  });

  it('keeps content too big for a row on the blobs drive, as one file written before its row, and reads it back for the model', () => {
    const storage = createChatStorage();

    storage.run(askEventDocAiChatMessagesAppend('doc-1', 'chat-1', [replyWithBigOutput]));

    const [row] = storage.rows;
    expect(row).toEqual(
      expect.objectContaining({
        kind: EventDocAiChatRowKind.ToolUse,
        toolName: 'renderDocument',
        data: { type: EventDocAiChatRowDataType.StorageDrive },
      }),
    );
    expect(storage.writes).toEqual([`file:doc-1/chat-1/${row!.sk}.json`, `row:${row!.sk}`]);
    // One file holds the row's whole content, wrapped in an object so content that is a plain string is still a JSON object on the drive.
    expect(storage.files.get(`doc-1/chat-1/${row!.sk}.json`)).toEqual({ content: { input: { id: 'doc-1' }, output: bigOutput } });
    expect(storage.run(askEventDocAiChatMessagesLoad('doc-1', 'chat-1'))).toEqual([replyWithBigOutput]);
  });

  it('tells the model content is unavailable when its file cannot be read, so one lost file never fails a turn', () => {
    const storage = createChatStorage();

    storage.run(askEventDocAiChatMessagesAppend('doc-1', 'chat-1', [replyWithBigOutput]));
    storage.files.clear();

    const [message] = storage.run(askEventDocAiChatMessagesLoad('doc-1', 'chat-1'));

    expect(message!.segments).toEqual([
      {
        type: 'tool-use',
        tools: [{ toolName: 'renderDocument', input: '', output: EVENT_DOC_AI_CHAT_ROW_CONTENT_UNAVAILABLE_NOTICE, toolCallId: 'call-1' }],
      },
    ]);
  });

  it('sends the browser a row held in storage as a marker only, never its content', () => {
    const storage = createChatStorage();

    storage.run(askEventDocAiChatMessagesAppend('doc-1', 'chat-1', [replyWithBigOutput]));

    const [page] = loadEveryPage(storage);

    expect(page!.rows[0]).toEqual(
      expect.objectContaining({
        kind: EventDocAiChatRowKind.ToolUse,
        toolName: 'renderDocument',
        data: { type: EventDocAiChatRowDataType.StorageDrive },
      }),
    );
    expect(eventDocAiChatRowsBytes(page!.rows)).toBeLessThan(1024);
  });
});

describe('event doc ai chat history pages', () => {
  const manyMessages = (count: number, text = 'A reply.'): EventDocAiChatMessage[] =>
    Array.from({ length: count }, (_value, index) => ({
      role: 'assistant' as const,
      segments: [{ type: 'text' as const, text: `${index}: ${text}` }],
    }));

  it('walks a long chat newest page first, with every row exactly once and each page oldest first', () => {
    const storage = createChatStorage();
    storage.run(askEventDocAiChatMessagesAppend('doc-1', 'chat-1', manyMessages(EVENT_DOC_AI_CHAT_PAGE_MAX_ROWS * 2 + 5)));

    const pages = loadEveryPage(storage);
    const loaded = pages.reduce<EventDocAiChatRow[]>((rows, page) => [...page.rows, ...rows], []);

    expect(pages.map((page) => page.rows.length)).toEqual([EVENT_DOC_AI_CHAT_PAGE_MAX_ROWS, EVENT_DOC_AI_CHAT_PAGE_MAX_ROWS, 5]);
    expect(pages.map((page) => page.hasMore)).toEqual([true, true, false]);
    expect(loaded.map((row) => row.sk)).toEqual(storage.rows.map((row) => row.sk));
    expect(pages[0]!.rows[pages[0]!.rows.length - 1]!.sk).toBe(storage.rows[storage.rows.length - 1]!.sk);
  });

  // A websocket message over 128 KB is never delivered, and nothing reports it.
  it('keeps every page within one websocket message however big its rows are', () => {
    const storage = createChatStorage();
    storage.run(askEventDocAiChatMessagesAppend('doc-1', 'chat-1', manyMessages(12, 'y'.repeat(40_000))));

    const pages = loadEveryPage(storage);

    expect(pages.length).toBeGreaterThan(1);
    expect(pages.every((page) => page.rows.length > 0)).toBe(true);
    expect(pages.every((page) => eventDocAiChatRowsBytes(page.rows) <= EVENT_DOC_AI_CHAT_PAGE_MAX_BYTES)).toBe(true);
    expect(pages.reduce((count, page) => count + page.rows.length, 0)).toBe(12);
  });

  it('answers an empty chat with no rows and nothing more', () => {
    expect(createChatStorage().run(askEventDocAiChatHistoryPage('doc-1', 'chat-1'))).toEqual({ rows: [], hasMore: false });
  });

  // Security regression: usage carries what a reply was charged at, and a chat only shows it when set to.
  it('leaves usage rows out of every page unless the chat lets usage reach the browser', () => {
    const hidden = createChatStorage();
    const shown = createChatStorage({ sendUsageToFrontend: true });
    hidden.run(askEventDocAiChatMessagesAppend('doc-1', 'chat-1', [question, reply]));
    shown.run(askEventDocAiChatMessagesAppend('doc-1', 'chat-1', [question, reply]));

    const kindsOf = (storage: ReturnType<typeof createChatStorage>) => loadEveryPage(storage).flatMap((page) => page.rows.map((row) => row.kind));

    expect(kindsOf(hidden)).not.toContain(EventDocAiChatRowKind.Usage);
    expect(kindsOf(shown).filter((kind) => kind === EventDocAiChatRowKind.Usage)).toHaveLength(1);
  });
});

// Security regression: a chat request is authorised against its document, and the chat id comes from the caller.
describe('event doc ai chat storage isolation', () => {
  it('finds nothing when a chat is asked for through another document', () => {
    const storage = createChatStorage();
    storage.run(askEventDocAiChatMessagesAppend('doc-1', 'chat-1', [question, replyWithBigOutput]));
    const bigRowSk = storage.rows[storage.rows.length - 1]!.sk;

    expect(storage.run(askEventDocAiChatMessagesLoad('doc-2', 'chat-1'))).toEqual([]);
    expect(storage.run(askEventDocAiChatHistoryPage('doc-2', 'chat-1'))).toEqual({ rows: [], hasMore: false });
    expect(() => storage.run(askEventDocAiChatRowContentLink('doc-2', 'chat-1', bigRowSk))).toThrow(/No such stored chat row content/);
    expect(storage.links).toEqual([]);
  });

  it('keeps one tenant from reading the rows of another', () => {
    const storage = createChatStorage();
    storage.run(askStorageScopeProvide('tenant-a', askEventDocAiChatMessagesAppend('doc-1', 'chat-1', [question])));

    expect(storage.run(askStorageScopeProvide('tenant-a', askEventDocAiChatMessagesLoad('doc-1', 'chat-1')))).toEqual([question]);
    expect(storage.run(askStorageScopeProvide('tenant-b', askEventDocAiChatMessagesLoad('doc-1', 'chat-1')))).toEqual([]);
    expect(storage.run(askStorageScopeProvide('tenant-b', askEventDocAiChatHistoryPage('doc-1', 'chat-1')))).toEqual({ rows: [], hasMore: false });
  });

  it('carries the tenant scope to the blobs drive and to the link', () => {
    const storage = createChatStorage();
    storage.run(askStorageScopeProvide('tenant-a', askEventDocAiChatMessagesAppend('doc-1', 'chat-1', [replyWithBigOutput])));
    const [row] = storage.rows;

    storage.run(askStorageScopeProvide('tenant-a', askEventDocAiChatRowContentLink('doc-1', 'chat-1', row!.sk)));

    expect(storage.links).toEqual([
      {
        drive: 'chat-blobs',
        filepath: `doc-1/chat-1/${row!.sk}.json`,
        expirationMs: EVENT_DOC_AI_CHAT_ROW_CONTENT_URL_EXPIRY_MS,
        scope: 'tenant-a',
      },
    ]);
  });
});

describe('askEventDocAiChatRowContentLink', () => {
  it('makes a short-lived link for content a row really holds in storage, and keeps it out of the log', () => {
    const storage = createChatStorage();
    storage.run(askEventDocAiChatMessagesAppend('doc-1', 'chat-1', [replyWithBigOutput]));
    const [row] = storage.rows;

    const { url } = storage.run(askEventDocAiChatRowContentLink('doc-1', 'chat-1', row!.sk));

    expect(url).toBe(`https://files.example/doc-1/chat-1/${row!.sk}.json?signature=abc`);
    expect(storage.links[0]!.expirationMs).toBe(EVENT_DOC_AI_CHAT_ROW_CONTENT_URL_EXPIRY_MS);
    expect(storage.redacted).toEqual([url]);
  });

  // Security regression: the row id comes from the caller and becomes a file path, so a link is only made for a
  // row that is known to hold its content there.
  it('refuses a row that holds its own content, a row that does not exist, and a made-up row id', () => {
    const storage = createChatStorage();
    storage.run(askEventDocAiChatMessagesAppend('doc-1', 'chat-1', [question, replyWithBigOutput]));
    const inlineRowSk = storage.rows[0]!.sk;
    const storedRowSk = storage.rows[storage.rows.length - 1]!.sk;

    expect(() => storage.run(askEventDocAiChatRowContentLink('doc-1', 'chat-1', inlineRowSk))).toThrow(/No such stored chat row content/);
    expect(() => storage.run(askEventDocAiChatRowContentLink('doc-1', 'chat-1', 'row-99999'))).toThrow(/No such stored chat row content/);
    expect(() => storage.run(askEventDocAiChatRowContentLink('doc-1', 'chat-1', `../chat-2/${storedRowSk}`))).toThrow(
      /No such stored chat row content/,
    );
    expect(storage.links).toEqual([]);
  });
});
