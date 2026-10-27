import { Nullable, QpqIsoDateTime } from 'quidproquo-core';

import { createEventDocInitialDocumentState } from '../../../../../../eventDoc/fold/createEventDocInitialDocumentState';
import { EventDocDocument } from '../../../../../../eventDoc/models/EventDocDocument';
import { MAINTENANCE_VERSION } from '../../constants/maintenanceVersion';
import { MaintenanceLevel } from '../../types/MaintenanceLevel';
import { MaintenanceType } from '../../types/MaintenanceType';
import { MaintenanceUpdateEntry } from './MaintenanceUpdateEntry';

// Folded purely from the event log. The updates list IS the document — the
// top-level fields are DERIVED from it (last surviving update wins; the eta
// carries over from the last update that announced one) and re-derived on every
// add/edit/remove, so deleting the newest update rolls the state back. A
// maintenance is ACTIVE while status is draft; closing publishes it, reopening
// branches a new draft (with a fresh update — the reopen flow enforces that).
export type MaintenanceState = EventDocDocument & {
  /** The site-wide banner line (last update's bannerText, reason when empty). */
  bannerText: string;
  reason: string;
  level: MaintenanceLevel;
  maintenanceType: MaintenanceType;
  /** Minutes from when the eta was announced; null = unknown. */
  etaDurationMins: Nullable<number>;
  etaEndsAt: Nullable<QpqIsoDateTime>;
  /** Services the maintenance touches; null = all. Informational on the frontend. */
  affectedServices: Nullable<string[]>;
  /** Chronological (oldest first). */
  updates: MaintenanceUpdateEntry[];
};

export const createInitialMaintenanceState = (): MaintenanceState => ({
  ...createEventDocInitialDocumentState(MAINTENANCE_VERSION),
  bannerText: '',
  reason: '',
  level: MaintenanceLevel.Low,
  maintenanceType: MaintenanceType.Deploy,
  etaDurationMins: null,
  etaEndsAt: null,
  affectedServices: null,
  updates: [],
});
