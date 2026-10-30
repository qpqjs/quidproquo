import { AdminSessionEffect } from '../effects/session/AdminSessionEffect';

// High-frequency events where only the latest value matters: while the previous
// event of the same type is still pending (never acked by the server), a new one
// replaces it instead of appending, rapid typing folds to one audit entry.
export const coalesceEventTypes: AdminSessionEffect[] = [
  AdminSessionEffect.TabChanged,
  AdminSessionEffect.SearchParamsChanged,
  AdminSessionEffect.ConfigServiceSelected,
];
