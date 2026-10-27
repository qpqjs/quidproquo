import { Nullable } from 'quidproquo-core';

import { MaintenanceLevel } from '../../types/MaintenanceLevel';
import { MaintenanceType } from '../../types/MaintenanceType';

// The full status snapshot one update carries — shared by ADD_UPDATE and
// EDIT_UPDATE.
export type MaintenanceUpdateData = {
  updateId: string;
  /** The site-wide banner line while this update is newest (empty = fall back to reason). */
  bannerText: string;
  /** This update's user-visible status line (the update feed). */
  reason: string;
  level: MaintenanceLevel;
  maintenanceType: MaintenanceType;
  /** Services the maintenance touches; null = all. */
  affectedServices: Nullable<string[]>;
  /** Admin-only; stripped by the public projection. */
  internalNotes: string;
  /**
   * ABSENT = no ETA announcement (the clock carries over from earlier updates).
   * A number re-anchors the clock to this event's server timestamp; null
   * explicitly clears it to unknown.
   */
  etaDurationMins?: Nullable<number>;
};
