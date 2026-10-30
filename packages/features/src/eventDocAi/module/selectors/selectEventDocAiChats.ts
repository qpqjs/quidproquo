import type { EventDocAiChatSummary } from '../../models';
import type { EventDocAiState } from '../types/EventDocAiState';

export const selectEventDocAiChats = (state: EventDocAiState): EventDocAiChatSummary[] => state.chats;
