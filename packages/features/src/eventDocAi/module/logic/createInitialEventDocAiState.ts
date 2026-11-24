import { EventDocAiState } from '../types/EventDocAiState';

export const createInitialEventDocAiState = (): EventDocAiState => ({
  chats: [],
  activeChatId: null,
  chatRows: [],
  chatMessages: [],
  streamSegments: [],
  isStreaming: false,
  isHistoryStale: false,
  isLoadingChats: false,
  isLoadingHistory: false,
  isSending: false,
  error: null,
});
