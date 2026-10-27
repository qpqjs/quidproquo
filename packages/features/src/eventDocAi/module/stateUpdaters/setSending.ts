import type { SetSendingPayload } from '../effects/EventDocAiSetSendingEffect';
import type { EventDocAiState } from '../EventDocAiState';

export const setSending = (state: EventDocAiState, { isSending }: SetSendingPayload): EventDocAiState => ({
  ...state,
  isSending,
});
