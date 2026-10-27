import { EventDocTransferPlanRow, EventDocTransferStatus } from '../../models';
import type { EventDocImportUiState } from '../types/EventDocImportUiState';

/** The rows an import would write (New and FastForward). */
export const selectEventDocImportWritableRows = (state: EventDocImportUiState): EventDocTransferPlanRow[] =>
  state.rows.filter((row) => row.status === EventDocTransferStatus.New || row.status === EventDocTransferStatus.FastForward);
