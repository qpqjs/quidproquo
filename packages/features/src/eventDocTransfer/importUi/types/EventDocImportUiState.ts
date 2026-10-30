import { Nullable } from '@qpqjs/core';

import { EventDocBundleSource, EventDocTransferPlanRow } from '../../models';

/** The import screen. `rows` holds the plan until the apply replaces it with the result; `isApplied` says which. */
export type EventDocImportUiState = {
  transferId: Nullable<string>;
  source: Nullable<EventDocBundleSource>;
  rows: EventDocTransferPlanRow[];
  isLoading: boolean;
  isApplying: boolean;
  isApplied: boolean;
  error: Nullable<string>;
};
