import type { AppendChatMessagePayload } from '../effects/EventDocAiAppendChatMessageEffect';
import { toEventDocAiLocalChatRows } from '../logic/toEventDocAiLocalChatRows';
import { withEventDocAiChatRows } from '../logic/withEventDocAiChatRows';
import type { EventDocAiState } from '../types/EventDocAiState';

export const appendChatMessage = (state: EventDocAiState, { message }: AppendChatMessagePayload): EventDocAiState =>
  withEventDocAiChatRows(state, [...state.chatRows, ...toEventDocAiLocalChatRows(message, state.chatRows.length)]);
