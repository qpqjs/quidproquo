import { AdminSessionEventType } from '../effects/session/AdminSessionEventType';

// High-frequency events where only the latest value matters: while the previous
// event of the same type is still pending (never acked by the server), a new one
// replaces it instead of appending — rapid typing folds to one audit entry.
export const coalesceEventTypes: AdminSessionEventType[] = [
  AdminSessionEventType.tabChanged,
  AdminSessionEventType.searchParamsChanged,
  AdminSessionEventType.configServiceSelected,
];
