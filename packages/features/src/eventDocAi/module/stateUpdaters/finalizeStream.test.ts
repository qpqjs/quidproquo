import { AiModel } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import type { FinalizeStreamPayload } from '../effects/EventDocAiFinalizeStreamEffect';
import { createInitialEventDocAiState } from '../logic/createInitialEventDocAiState';
import type { EventDocAiState } from '../types/EventDocAiState';
import { appendChatMessage } from './appendChatMessage';
import { finalizeStream } from './finalizeStream';
import { setMessages } from './setMessages';

const streaming: EventDocAiState = {
  ...appendChatMessage(
    { ...createInitialEventDocAiState(), activeChatId: 'chat-1' },
    { message: { role: 'user', segments: [{ type: 'text', text: 'Add a paragraph.' }] } },
  ),
  streamSegments: [
    { type: 'tool-use', tools: [{ toolName: 'editDocument', input: { text: 'A paragraph.' }, output: { ok: true }, toolCallId: 'call-1' }] },
    { type: 'text', text: 'Done.' },
  ],
  isStreaming: true,
};

const payload: FinalizeStreamPayload = {
  chatId: 'chat-1',
  model: AiModel.ClaudeSonnet46,
  trailingSegments: [],
  isPartial: false,
};

describe('finalizeStream', () => {
  it('moves the streamed reply into the finalized messages and clears the stream', () => {
    const state = finalizeStream(streaming, payload);

    expect(state.chatMessages).toEqual([
      ...streaming.chatMessages,
      { role: 'assistant', segments: streaming.streamSegments, model: AiModel.ClaudeSonnet46 },
    ]);
    expect(state.streamSegments).toEqual([]);
    expect(state.isStreaming).toBe(false);
    expect(state.isHistoryStale).toBe(false);
  });

  it('puts usage on the message only when the server sends it', () => {
    const usage = { inputTokens: 1200, outputTokens: 40 };

    expect(finalizeStream(streaming, { ...payload, usage }).chatMessages[1]).toEqual(expect.objectContaining({ usage }));
    expect(finalizeStream(streaming, payload).chatMessages[1]).not.toHaveProperty('usage');
  });

  it('adds the segments the server appended after the stream', () => {
    const notice = { type: 'text' as const, text: 'The model stopped without answering.' };
    const state = finalizeStream(streaming, { ...payload, trailingSegments: [notice] });

    expect(state.chatMessages[1]!.segments).toEqual([...streaming.streamSegments, notice]);
    expect(state.isHistoryStale).toBe(false);
  });

  it('marks the history stale when the server held a part back', () => {
    expect(finalizeStream(streaming, { ...payload, isPartial: true }).isHistoryStale).toBe(true);
  });

  // What is streaming belongs to the open chat, so a signal for another chat must not touch it.
  it('changes nothing when the reply belongs to a chat that is not open', () => {
    const otherChatOpen = { ...streaming, activeChatId: 'chat-2' };

    expect(finalizeStream(otherChatOpen, payload)).toBe(otherChatOpen);
  });

  it('keeps the rows and the messages in step', () => {
    const state = finalizeStream(streaming, payload);

    expect(state.chatRows.map((row) => [row.role, row.kind])).toEqual([
      ['user', 'text'],
      ['assistant', 'toolUse'],
      ['assistant', 'text'],
    ]);
    expect(new Set(state.chatRows.map((row) => row.messageId)).size).toBe(2);
  });

  it('is no longer stale once the messages are set from the server', () => {
    const stale = finalizeStream(streaming, { ...payload, isPartial: true });

    expect(setMessages(stale, { messages: [] }).isHistoryStale).toBe(false);
  });
});
