import type { EventDocAiChatRow } from '../../models';
import type { EventDocAiState } from '../types/EventDocAiState';
import { eventDocAiChatRowsToMessages } from './eventDocAiChatRowsToMessages';

/** The state with the active chat's rows replaced and its messages rebuilt from them, so the two never disagree. */
export const withEventDocAiChatRows = (state: EventDocAiState, chatRows: EventDocAiChatRow[]): EventDocAiState => ({
  ...state,
  chatRows,
  chatMessages: eventDocAiChatRowsToMessages(chatRows),
});
