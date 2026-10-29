import type { SetErrorPayload } from '../effects/EventDocAiSetErrorEffect';
import type { EventDocAiState } from '../types/EventDocAiState';

export const setError = (state: EventDocAiState, { error }: SetErrorPayload): EventDocAiState => ({
  ...state,
  error,
});
