import type { AiModel, AiStreamUsage } from '@qpqjs/core';

import type { EventDocAiAttachment } from './EventDocAiAttachment';
import type { EventDocAiChatRowData } from './EventDocAiChatRowData';
import type { EventDocAiChatRowKind } from './EventDocAiChatRowKind';
import type { EventDocAiChatToolUseContent } from './EventDocAiChatToolUseContent';

// What every row of a chat carries, whatever it holds.
type EventDocAiChatRowBase = {
  // The row's sortable id, and its place in the chat. Empty on a row the browser made itself.
  sk: string;
  // The message this row is a piece of; a message's rows share it.
  messageId: string;
  role: 'user' | 'assistant';
  // Assistant rows only: the model that produced the reply.
  model?: AiModel;
};

/**
 * One piece of a chat message, as it is stored and as the browser is sent it. A message is saved as several
 * rows because a whole reply can be far bigger than a row may be. Each row is whole on its own, so a page of
 * rows can start or end anywhere. A row whose content can be big keeps it in `data`, on the row or in storage.
 */
export type EventDocAiChatRow =
  | (EventDocAiChatRowBase & { kind: EventDocAiChatRowKind.Text; data: EventDocAiChatRowData<string> })
  | (EventDocAiChatRowBase & { kind: EventDocAiChatRowKind.Reasoning; data: EventDocAiChatRowData<string> })
  | (EventDocAiChatRowBase & { kind: EventDocAiChatRowKind.File; attachment: EventDocAiAttachment })
  | (EventDocAiChatRowBase & {
      kind: EventDocAiChatRowKind.ToolUse;
      toolName: string;
      toolCallId?: string;
      data: EventDocAiChatRowData<EventDocAiChatToolUseContent>;
    })
  | (EventDocAiChatRowBase & { kind: EventDocAiChatRowKind.Usage; usage: AiStreamUsage });
