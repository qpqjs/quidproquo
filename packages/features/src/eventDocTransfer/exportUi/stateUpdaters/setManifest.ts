import type { EventDocExportUiSetManifestPayload } from '../effects/EventDocExportUiSetManifestEffect';
import type { EventDocExportUiState } from '../types/EventDocExportUiState';

/** Stores the manifest and clears loading. */
export const setManifest = (state: EventDocExportUiState, { items }: EventDocExportUiSetManifestPayload): EventDocExportUiState => ({
  ...state,
  items,
  isLoading: false,
});
