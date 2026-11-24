import type { Nullable } from '@qpqjs/core';

import type { EventDocAiChatMessage, EventDocAiChatRow, EventDocAiChatSummary, EventDocAiMessageSegment } from '../../models';

// Which service/doc-type/document the module talks to comes from the
// eventDocAi QPQ context (provided around the chat UI), not from state.
export type EventDocAiState = {
  chats: EventDocAiChatSummary[];
  activeChatId: Nullable<string>;

  // The rows of the active chat, oldest first: the pages loaded from the server, then what was added here.
  chatRows: EventDocAiChatRow[];
  // Finalized messages of the active chat (user + assistant). Always the rows above grouped into
  // messages; every updater that changes the rows sets both.
  chatMessages: EventDocAiChatMessage[];
  // The in-flight assistant reply, folded as each stream part arrives; cleared
  // once the reply is finalized.
  streamSegments: EventDocAiMessageSegment[];
  // True from the first stream part until the stream is cleared, so the UI can
  // show activity before any renderable segment exists.
  isStreaming: boolean;
  // True when the finalized messages are known not to match what the server saved (the server held
  // part of a reply back). The chat is reloaded from the server when the send ends.
  isHistoryStale: boolean;

  isLoadingChats: boolean;
  isLoadingHistory: boolean;
  isSending: boolean;
  error: Nullable<string>;
};
