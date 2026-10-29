import type { SetSendingPayload } from '../effects/EventDocAiSetSendingEffect';
import type { EventDocAiState } from '../types/EventDocAiState';

export const setSending = (state: EventDocAiState, { isSending }: SetSendingPayload): EventDocAiState => ({
  ...state,
  isSending,
});
