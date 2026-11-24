import type { EventDocAiChatMessage, EventDocAiChatRow, EventDocAiMessageSegment, EventDocAiToolUse } from '../../models';
import { EventDocAiChatRowDataType } from '../../models/EventDocAiChatRowDataType';
import { EventDocAiChatRowKind } from '../../models/EventDocAiChatRowKind';

// Text still in storage reads as empty until it has been loaded and put on the row.
const textOf = (row: Extract<EventDocAiChatRow, { kind: EventDocAiChatRowKind.Text | EventDocAiChatRowKind.Reasoning }>): string =>
  row.data.type === EventDocAiChatRowDataType.Inline ? row.data.content : '';

// A tool call still in storage reads as one with no input or result yet, so it shows as still running, never
// with a made-up result.
const toToolUse = (row: Extract<EventDocAiChatRow, { kind: EventDocAiChatRowKind.ToolUse }>): EventDocAiToolUse => {
  const content = row.data.type === EventDocAiChatRowDataType.Inline ? row.data.content : { input: '' };

  return {
    toolName: row.toolName,
    input: content.input,
    ...(content.output === undefined ? {} : { output: content.output }),
    ...(row.toolCallId === undefined ? {} : { toolCallId: row.toolCallId }),
  };
};

const addRow = (message: EventDocAiChatMessage, row: EventDocAiChatRow): EventDocAiChatMessage => {
  const last = message.segments[message.segments.length - 1];

  switch (row.kind) {
    case EventDocAiChatRowKind.Text:
      return { ...message, segments: [...message.segments, { type: 'text', text: textOf(row) }] };

    case EventDocAiChatRowKind.Reasoning:
      return { ...message, segments: [...message.segments, { type: 'reasoning', text: textOf(row) }] };

    case EventDocAiChatRowKind.File:
      return { ...message, segments: [...message.segments, { type: 'file', attachment: row.attachment }] };

    case EventDocAiChatRowKind.ToolUse: {
      // Tool calls that follow one another are one segment, as they were when the message was saved.
      const segments: EventDocAiMessageSegment[] =
        last?.type === 'tool-use'
          ? [...message.segments.slice(0, -1), { type: 'tool-use', tools: [...last.tools, toToolUse(row)] }]
          : [...message.segments, { type: 'tool-use', tools: [toToolUse(row)] }];

      return { ...message, segments };
    }

    case EventDocAiChatRowKind.Usage:
      return { ...message, usage: row.usage };
  }
};

/**
 * Chat rows, oldest first, as the messages they are pieces of. Rows that follow one another with the same
 * message id are one message. The reverse of eventDocAiMessageToChatRowDrafts.
 */
export const eventDocAiChatRowsToMessages = (rows: EventDocAiChatRow[]): EventDocAiChatMessage[] => {
  const messages: EventDocAiChatMessage[] = [];
  let currentMessageId: string | undefined;

  for (const row of rows) {
    const current = row.messageId === currentMessageId ? messages.pop() : undefined;
    const message: EventDocAiChatMessage = current ?? { role: row.role, segments: [], ...(row.model === undefined ? {} : { model: row.model }) };

    messages.push(addRow(message, row));
    currentMessageId = row.messageId;
  }

  return messages;
};
