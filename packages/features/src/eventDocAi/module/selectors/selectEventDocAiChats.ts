import type { EventDocAiChatSummary } from '../../models';
import type { EventDocAiState } from '../EventDocAiState';

export const selectEventDocAiChats = (state: EventDocAiState): EventDocAiChatSummary[] => state.chats;
