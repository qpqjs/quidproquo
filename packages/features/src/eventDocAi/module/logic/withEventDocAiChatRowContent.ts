import type { EventDocAiChatRow, EventDocAiChatToolUseContent } from '../../models';
import { EventDocAiChatRowDataType } from '../../models/EventDocAiChatRowDataType';
import { EventDocAiChatRowKind } from '../../models/EventDocAiChatRowKind';

const isToolUseContent = (content: unknown): content is EventDocAiChatToolUseContent =>
  typeof content === 'object' && content !== null && 'input' in content;

/**
 * The row with content that was read from storage put back on it. Content of the wrong shape for the row's kind
 * (a damaged file) is shown as text, or as a tool call's result, so it is never mistaken for nothing.
 */
export const withEventDocAiChatRowContent = (row: EventDocAiChatRow, content: unknown): EventDocAiChatRow => {
  if (row.kind === EventDocAiChatRowKind.Text || row.kind === EventDocAiChatRowKind.Reasoning) {
    return { ...row, data: { type: EventDocAiChatRowDataType.Inline, content: typeof content === 'string' ? content : JSON.stringify(content) } };
  }

  if (row.kind === EventDocAiChatRowKind.ToolUse) {
    return {
      ...row,
      data: { type: EventDocAiChatRowDataType.Inline, content: isToolUseContent(content) ? content : { input: '', output: content } },
    };
  }

  return row;
};
