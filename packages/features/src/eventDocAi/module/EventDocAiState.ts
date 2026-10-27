import type { Nullable } from 'quidproquo-core';

import type { EventDocAiChatMessage, EventDocAiChatSummary, EventDocAiMessageSegment } from '../models';

// Which service/doc-type/document the module talks to comes from the
// eventDocAi QPQ context (provided around the chat UI), not from state.
export type EventDocAiState = {
  chats: EventDocAiChatSummary[];
  activeChatId: Nullable<string>;

  // Finalized messages of the active chat (user + assistant).
  chatMessages: EventDocAiChatMessage[];
  // The in-flight assistant reply, folded as each stream part arrives; cleared
  // once the reply is finalized.
  streamSegments: EventDocAiMessageSegment[];
  // True from the first stream part until the stream is cleared, so the UI can
  // show activity before any renderable segment exists.
  isStreaming: boolean;

  isLoadingChats: boolean;
  isLoadingHistory: boolean;
  isSending: boolean;
  error: Nullable<string>;
};

export const createInitialEventDocAiState = (): EventDocAiState => ({
  chats: [],
  activeChatId: null,
  chatMessages: [],
  streamSegments: [],
  isStreaming: false,
  isLoadingChats: false,
  isLoadingHistory: false,
  isSending: false,
  error: null,
});
