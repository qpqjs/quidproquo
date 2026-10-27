import { EventDocDocRef } from '../../models';
import type { EventDocExportUiState } from '../types/EventDocExportUiState';

/** Selector factory: the ticked candidates as transfer refs. `serviceName` is needed because summaries do not carry it. */
export const createEventDocExportSelectedRefs =
  (serviceName: string) =>
  (state: EventDocExportUiState): EventDocDocRef[] =>
    state.candidates
      .filter((candidate) => state.selectedIds.includes(candidate.id))
      .map((candidate) => ({ service: serviceName, type: candidate.type, id: candidate.id }));
