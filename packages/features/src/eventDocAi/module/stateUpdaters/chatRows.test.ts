import { AiStreamPartType } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import type { EventDocAiChatRow } from '../../models';
import { EventDocAiChatRowDataType } from '../../models/EventDocAiChatRowDataType';
import { EventDocAiChatRowKind } from '../../models/EventDocAiChatRowKind';
import { createInitialEventDocAiState } from '../logic/createInitialEventDocAiState';
import type { EventDocAiState } from '../types/EventDocAiState';
import { appendChatMessage } from './appendChatMessage';
import { appendStreamChunk } from './appendStreamChunk';
import { clearStream } from './clearStream';
import { prependChatRows } from './prependChatRows';
import { setChatRowContent } from './setChatRowContent';
import { setChatRows } from './setChatRows';
import { setMessages } from './setMessages';

const textRow = (sk: string, messageId: string, value: string): EventDocAiChatRow => ({
  sk,
  messageId,
  role: 'assistant',
  kind: EventDocAiChatRowKind.Text,
  data: { type: EventDocAiChatRowDataType.Inline, content: value },
});

const open: EventDocAiState = { ...createInitialEventDocAiState(), activeChatId: 'chat-1' };
const textsOf = (state: EventDocAiState) =>
  state.chatMessages.map((message) => message.segments.map((segment) => (segment.type === 'text' ? segment.text : segment.type)));

describe('chat row state updaters', () => {
  it('adds an older page above the rows already loaded and regroups the messages', () => {
    const newest = prependChatRows(open, {
      chatId: 'chat-1',
      rows: [textRow('row-3', 'message-2', 'second half'), textRow('row-4', 'message-3', 'newest')],
    });
    const all = prependChatRows(newest, {
      chatId: 'chat-1',
      rows: [textRow('row-1', 'message-1', 'oldest'), textRow('row-2', 'message-2', 'first half')],
    });

    expect(textsOf(newest)).toEqual([['second half'], ['newest']]);
    // The message split across the two pages is one message again.
    expect(textsOf(all)).toEqual([['oldest'], ['first half', 'second half'], ['newest']]);
  });

  // A page asked for before the person switched chat can still arrive afterwards.
  it('drops a page, a reload and row content that belong to a chat that is not open', () => {
    const loaded = prependChatRows(open, { chatId: 'chat-1', rows: [textRow('row-1', 'message-1', 'mine')] });

    expect(prependChatRows(loaded, { chatId: 'chat-2', rows: [textRow('row-9', 'message-9', 'theirs')] })).toBe(loaded);
    expect(setChatRows(loaded, { chatId: 'chat-2', rows: [] })).toBe(loaded);
    expect(setChatRowContent(loaded, { chatId: 'chat-2', sk: 'row-1', content: 'theirs' })).toBe(loaded);
  });

  it('replaces the rows on a reload and is then no longer stale', () => {
    const stale = { ...prependChatRows(open, { chatId: 'chat-1', rows: [textRow('row-1', 'message-1', 'old')] }), isHistoryStale: true };

    const reloaded = setChatRows(stale, { chatId: 'chat-1', rows: [textRow('row-1', 'message-1', 'old'), textRow('row-2', 'message-2', 'new')] });

    expect(textsOf(reloaded)).toEqual([['old'], ['new']]);
    expect(reloaded.isHistoryStale).toBe(false);
  });

  it('puts downloaded content on its row and into its message', () => {
    const stored: EventDocAiChatRow = {
      sk: 'row-1',
      messageId: 'message-1',
      role: 'assistant',
      kind: EventDocAiChatRowKind.Text,
      data: { type: EventDocAiChatRowDataType.StorageDrive },
    };
    const loaded = prependChatRows(open, { chatId: 'chat-1', rows: [stored] });

    expect(textsOf(loaded)).toEqual([['']]);
    expect(textsOf(setChatRowContent(loaded, { chatId: 'chat-1', sk: 'row-1', content: 'the long text' }))).toEqual([['the long text']]);
  });

  it('keeps what was added in the browser below the pages loaded from the server', () => {
    const withQuestion = appendChatMessage(open, { message: { role: 'user', segments: [{ type: 'text', text: 'my question' }] } });
    const withHistory = prependChatRows(withQuestion, { chatId: 'chat-1', rows: [textRow('row-1', 'message-1', 'earlier')] });

    expect(textsOf(withHistory)).toEqual([['earlier'], ['my question']]);
  });

  it('never lets content for a server row land on a row the browser made itself', () => {
    const withQuestion = appendChatMessage(open, { message: { role: 'user', segments: [{ type: 'text', text: 'my question' }] } });

    expect(textsOf(setChatRowContent(withQuestion, { chatId: 'chat-1', sk: '', content: 'overwritten' }))).toEqual([['my question']]);
  });

  it('empties the rows with the messages', () => {
    const loaded = prependChatRows(open, { chatId: 'chat-1', rows: [textRow('row-1', 'message-1', 'old')] });

    expect(setMessages(loaded, { messages: [] })).toEqual(expect.objectContaining({ chatRows: [], chatMessages: [] }));
  });
});

// A reply that is still streaming belongs to one chat. If the person opens another, it must not show there.
describe('stream state updaters', () => {
  const part = { type: AiStreamPartType.TextDelta, id: 'text-1', text: 'Hello' } as const;

  it('folds a part of the open chat, and a part with no chat named', () => {
    expect(appendStreamChunk(open, { part, chatId: 'chat-1' }).streamSegments).toEqual([{ type: 'text', text: 'Hello' }]);
    expect(appendStreamChunk(open, { part }).streamSegments).toEqual([{ type: 'text', text: 'Hello' }]);
  });

  it('drops a part of a reply for a chat that is not open', () => {
    expect(appendStreamChunk(open, { part, chatId: 'chat-2' })).toBe(open);
  });

  it("clears the open chat's stream, and leaves it alone when another chat is named", () => {
    const streaming = appendStreamChunk(open, { part, chatId: 'chat-1' });

    expect(clearStream(streaming, { chatId: 'chat-2' })).toBe(streaming);
    expect(clearStream(streaming, { chatId: 'chat-1' }).streamSegments).toEqual([]);
    expect(clearStream(streaming, {}).isStreaming).toBe(false);
  });
});
