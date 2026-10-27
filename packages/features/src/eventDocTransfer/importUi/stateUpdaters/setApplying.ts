import type { EventDocImportUiSetApplyingPayload } from '../effects/EventDocImportUiSetApplyingEffect';
import type { EventDocImportUiState } from '../types/EventDocImportUiState';

/** Sets the applying flag. */
export const setApplying = (state: EventDocImportUiState, { isApplying }: EventDocImportUiSetApplyingPayload): EventDocImportUiState => ({
  ...state,
  isApplying,
});
