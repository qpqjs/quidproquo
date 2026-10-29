import { EventDocAiState } from '../types/EventDocAiState';

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
