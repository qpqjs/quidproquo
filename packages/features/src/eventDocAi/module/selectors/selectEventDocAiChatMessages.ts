import type { EventDocAiChatMessage } from '../../models';
import type { EventDocAiState } from '../EventDocAiState';

export const selectEventDocAiChatMessages = (state: EventDocAiState): EventDocAiChatMessage[] => state.chatMessages;
