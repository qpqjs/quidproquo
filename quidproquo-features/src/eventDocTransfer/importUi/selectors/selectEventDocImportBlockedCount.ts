import { EventDocTransferStatus } from '../../models';
import type { EventDocImportUiState } from '../types/EventDocImportUiState';

/** How many rows are blocked (Diverged, CodeConflict, Ignored). Same is not blocked. */
export const selectEventDocImportBlockedCount = (state: EventDocImportUiState): number =>
  state.rows.filter(
    (row) =>
      row.status === EventDocTransferStatus.Diverged ||
      row.status === EventDocTransferStatus.CodeConflict ||
      row.status === EventDocTransferStatus.Ignored,
  ).length;
