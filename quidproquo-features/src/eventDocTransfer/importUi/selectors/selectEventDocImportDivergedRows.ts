import { EventDocTransferPlanRow, EventDocTransferStatus } from '../../models';
import type { EventDocImportUiState } from '../types/EventDocImportUiState';

/** The rows a forced overwrite would act on (Diverged only; force cannot fix a code conflict). */
export const selectEventDocImportDivergedRows = (state: EventDocImportUiState): EventDocTransferPlanRow[] =>
  state.rows.filter((row) => row.status === EventDocTransferStatus.Diverged);
