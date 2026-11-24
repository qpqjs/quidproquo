import type { EventDocAiChatMessage, EventDocAiChatRowDraft, EventDocAiMessageSegment } from '../../models';
import { EventDocAiChatRowDataType } from '../../models/EventDocAiChatRowDataType';
import { EventDocAiChatRowKind } from '../../models/EventDocAiChatRowKind';

type RowBase = Pick<EventDocAiChatRowDraft, 'role' | 'model'>;

const inline = <TContent>(content: TContent) => ({ type: EventDocAiChatRowDataType.Inline as const, content });

const segmentToDrafts = (segment: EventDocAiMessageSegment, base: RowBase): EventDocAiChatRowDraft[] => {
  switch (segment.type) {
    case 'text':
      return [{ ...base, kind: EventDocAiChatRowKind.Text, data: inline(segment.text) }];

    case 'reasoning':
      return [{ ...base, kind: EventDocAiChatRowKind.Reasoning, data: inline(segment.text) }];

    case 'file':
      return [{ ...base, kind: EventDocAiChatRowKind.File, attachment: segment.attachment }];

    case 'tool-use':
      return segment.tools.map((tool) => ({
        ...base,
        kind: EventDocAiChatRowKind.ToolUse as const,
        toolName: tool.toolName,
        ...(tool.toolCallId === undefined ? {} : { toolCallId: tool.toolCallId }),
        data: inline({ input: tool.input, ...(tool.output === undefined ? {} : { output: tool.output }) }),
      }));
  }
};

/**
 * A message as the rows it is saved as, in order: one per text, reasoning or file segment, one per tool call,
 * and a last one for its usage when it has any. Every row holds its own content; the writer moves the big ones
 * to storage. eventDocAiChatRowsToMessages turns the rows back into the same message.
 */
export const eventDocAiMessageToChatRowDrafts = (message: EventDocAiChatMessage): EventDocAiChatRowDraft[] => {
  const base: RowBase = { role: message.role, ...(message.model === undefined ? {} : { model: message.model }) };

  return [
    ...message.segments.flatMap((segment) => segmentToDrafts(segment, base)),
    ...(message.usage === undefined ? [] : [{ ...base, kind: EventDocAiChatRowKind.Usage as const, usage: message.usage }]),
  ];
};
