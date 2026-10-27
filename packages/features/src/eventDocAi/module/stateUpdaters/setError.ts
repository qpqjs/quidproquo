import type { SetErrorPayload } from '../effects/EventDocAiSetErrorEffect';
import type { EventDocAiState } from '../EventDocAiState';

export const setError = (state: EventDocAiState, { error }: SetErrorPayload): EventDocAiState => ({
  ...state,
  error,
});
