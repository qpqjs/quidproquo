import { Nullable, QpqIsoDateTime } from 'quidproquo-core';

import { MaintenanceLevel } from '../../types/MaintenanceLevel';
import { MaintenanceType } from '../../types/MaintenanceType';

// One folded update — a full status snapshot. `reason` is the user-visible
// status line; `internalNotes` never leaves the admin surface. The ETA pair is
// only set on entries that ANNOUNCED an eta (`etaSetAt` = the announcing
// event's server timestamp — re-anchored when an edit changes the duration);
// entries without an announcement inherit the clock from earlier entries at
// derive time. Timestamps come from event metadata, so every fold agrees.
export type MaintenanceUpdateEntry = {
  id: string;
  /** The site-wide banner line while this update is newest (empty = reason). */
  bannerText: string;
  reason: string;
  level: MaintenanceLevel;
  maintenanceType: MaintenanceType;
  affectedServices: Nullable<string[]>;
  internalNotes: string;
  /** Meaningful only when etaSetAt is set; null there = explicitly cleared to unknown. */
  etaDurationMins: Nullable<number>;
  etaSetAt: Nullable<QpqIsoDateTime>;
  createdAt: QpqIsoDateTime;
  updatedAt: Nullable<QpqIsoDateTime>;
  createdByDisplayName: string;
};
