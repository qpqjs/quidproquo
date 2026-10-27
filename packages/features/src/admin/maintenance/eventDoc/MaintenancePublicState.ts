import { Nullable, QpqIsoDateTime } from 'quidproquo-core';

import { EventDocStatus } from '../../../eventDoc/models/EventDocStatus';
import { MaintenanceLevel } from './v1/types/MaintenanceLevel';
import { MaintenanceType } from './v1/types/MaintenanceType';

// One update as users may see it — the status line only, no internal notes, no author.
export type MaintenancePublicUpdate = {
  id: string;
  displayText: string;
  createdAt: QpqIsoDateTime;
};

// The ONLY maintenance shape that leaves the admin surface (websocket broadcasts
// and the connect-time push). Derived from the fold via toMaintenancePublicState;
// internal notes and authoring metadata are stripped there, never filtered
// client-side.
export type MaintenancePublicState = {
  id: string;
  status: EventDocStatus;
  /** The site-wide banner line. */
  bannerText: string;
  reason: string;
  level: MaintenanceLevel;
  maintenanceType: MaintenanceType;
  etaDurationMins: Nullable<number>;
  etaEndsAt: Nullable<QpqIsoDateTime>;
  affectedServices: Nullable<string[]>;
  updates: MaintenancePublicUpdate[];
  updatedAt: QpqIsoDateTime;
};
