import { EventDocManifestItem } from '../../models';
import type { EventDocExportUiState } from '../types/EventDocExportUiState';

/** The docs the operator picked (depth 0). */
export const selectEventDocExportRoots = (state: EventDocExportUiState): EventDocManifestItem[] => state.items.filter((item) => item.depth === 0);
