import { AiModel } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import type { EventDocAiChatMessage, EventDocAiChatRow } from '../../models';
import { eventDocAiChatRowsToMessages } from './eventDocAiChatRowsToMessages';
import { getEventDocAiChatRowInlineContent } from './getEventDocAiChatRowInlineContent';
import { isEventDocAiChatRowStored } from './isEventDocAiChatRowStored';
import { toEventDocAiLocalChatRows } from './toEventDocAiLocalChatRows';
import { withEventDocAiChatRowContent } from './withEventDocAiChatRowContent';
import { withEventDocAiChatRowStored } from './withEventDocAiChatRowStored';

const messages: EventDocAiChatMessage[] = [
  {
    role: 'user',
    segments: [
      { type: 'file', attachment: { assetId: 'asset-1', filename: 'brief.pdf', mediaType: 'application/pdf' } },
      { type: 'text', text: 'Add a third paragraph.' },
    ],
  },
  {
    role: 'assistant',
    model: AiModel.ClaudeSonnet46,
    usage: { inputTokens: 1200, outputTokens: 40 },
    segments: [
      { type: 'reasoning', text: 'Thinking.' },
      {
        type: 'tool-use',
        tools: [
          { toolName: 'readDocument', input: {}, output: null, toolCallId: 'call-1' },
          { toolName: 'askUser', input: { question: 'Which paragraph?' } },
        ],
      },
      { type: 'text', text: 'Done.' },
      { type: 'text', text: 'A notice after the reply.' },
      { type: 'tool-use', tools: [{ toolName: 'editDocument', input: 'raw', output: { ok: true }, toolCallId: 'call-3' }] },
    ],
  },
  // Two messages in a row from the same side stay two messages.
  { role: 'assistant', model: AiModel.ClaudeSonnet46, segments: [{ type: 'text', text: 'And another thing.' }] },
];

const toRows = (all: EventDocAiChatMessage[]): EventDocAiChatRow[] =>
  all.reduce<EventDocAiChatRow[]>((rows, message) => [...rows, ...toEventDocAiLocalChatRows(message, rows.length)], []);

describe('chat rows and messages', () => {
  // The reply is never sent again and the chat is never saved whole, so this must lose nothing.
  it('turns messages into rows and back without changing them', () => {
    expect(eventDocAiChatRowsToMessages(toRows(messages))).toEqual(messages);
  });

  it('keeps a tool result of null as a result, and a call with no result as still waiting', () => {
    const [, reply] = eventDocAiChatRowsToMessages(toRows(messages));
    const [answered, waiting] = (reply!.segments[1] as { tools: { output?: unknown }[] }).tools;

    expect('output' in answered!).toBe(true);
    expect(answered!.output).toBeNull();
    expect('output' in waiting!).toBe(false);
  });

  it('rebuilds a message whose rows arrived in two pages', () => {
    const rows = toRows(messages);
    const olderPage = rows.slice(0, 4);
    const newerPage = rows.slice(4);

    expect(eventDocAiChatRowsToMessages([...olderPage, ...newerPage])).toEqual(messages);
    // The newer page on its own is still readable: it starts part way through the reply.
    expect(eventDocAiChatRowsToMessages(newerPage)[0]).toEqual(expect.objectContaining({ role: 'assistant', model: AiModel.ClaudeSonnet46 }));
  });

  it('shows content still in storage as not there yet, never as made-up content', () => {
    const [toolRow, textRow] = toRows([
      {
        role: 'assistant',
        segments: [
          { type: 'tool-use', tools: [{ toolName: 'render', input: { id: 1 }, output: { html: '' } }] },
          { type: 'text', text: 'Done.' },
        ],
      },
    ]);

    const [message] = eventDocAiChatRowsToMessages([withEventDocAiChatRowStored(toolRow!), withEventDocAiChatRowStored(textRow!)]);

    // The tool keeps its name and shows as still running; the text is empty.
    expect(message!.segments).toEqual([
      { type: 'tool-use', tools: [{ toolName: 'render', input: '' }] },
      { type: 'text', text: '' },
    ]);
  });

  it('puts content read from storage back on its row', () => {
    const [row] = toRows([{ role: 'assistant', segments: [{ type: 'tool-use', tools: [{ toolName: 'render', input: { id: 1 }, output: 'x' }] }] }]);
    const stored = withEventDocAiChatRowStored(row!);

    expect(isEventDocAiChatRowStored(stored)).toBe(true);
    expect(getEventDocAiChatRowInlineContent(stored)).toBeNull();

    const loaded = withEventDocAiChatRowContent(stored, { input: { id: 1 }, output: { html: '<p>Hi</p>' } });

    expect(isEventDocAiChatRowStored(loaded)).toBe(false);
    expect(eventDocAiChatRowsToMessages([loaded])[0]!.segments).toEqual([
      { type: 'tool-use', tools: [{ toolName: 'render', input: { id: 1 }, output: { html: '<p>Hi</p>' } }] },
    ]);
  });

  // A damaged file must show as something, never as a tool that is still running.
  it('shows content of the wrong shape as the result of its tool call, or as text', () => {
    const [toolRow, textRow] = toRows([
      {
        role: 'assistant',
        segments: [
          { type: 'tool-use', tools: [{ toolName: 'render', input: {}, output: 'x' }] },
          { type: 'text', text: 'Done.' },
        ],
      },
    ]);

    const tool = eventDocAiChatRowsToMessages([withEventDocAiChatRowContent(withEventDocAiChatRowStored(toolRow!), '[content unavailable]')]);
    const text = eventDocAiChatRowsToMessages([withEventDocAiChatRowContent(withEventDocAiChatRowStored(textRow!), { not: 'text' })]);

    expect(tool[0]!.segments).toEqual([{ type: 'tool-use', tools: [{ toolName: 'render', input: '', output: '[content unavailable]' }] }]);
    expect(text[0]!.segments).toEqual([{ type: 'text', text: '{"not":"text"}' }]);
  });

  it('leaves a row with nothing that can be big alone', () => {
    const [fileRow] = toRows([
      { role: 'user', segments: [{ type: 'file', attachment: { assetId: 'a', filename: 'a.pdf', mediaType: 'application/pdf' } }] },
    ]);

    expect(withEventDocAiChatRowStored(fileRow!)).toBe(fileRow);
    expect(withEventDocAiChatRowContent(fileRow!, 'x')).toBe(fileRow);
    expect(getEventDocAiChatRowInlineContent(fileRow!)).toBeNull();
  });
});
