import type { EventDocExportUiSetCandidatesPayload } from '../effects/EventDocExportUiSetCandidatesEffect';
import type { EventDocExportUiState } from '../types/EventDocExportUiState';

/** Stores the docs available to pick. */
export const setCandidates = (state: EventDocExportUiState, { candidates }: EventDocExportUiSetCandidatesPayload): EventDocExportUiState => ({
  ...state,
  candidates,
  isLoading: false,
});
