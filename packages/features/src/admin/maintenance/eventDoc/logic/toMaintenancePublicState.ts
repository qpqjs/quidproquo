import { MaintenancePublicState } from '../MaintenancePublicState';
import { MaintenanceState } from '../v1/views/document/MaintenanceState';

// The one place the public projection is built — internal notes and authoring
// metadata are stripped HERE, never filtered client-side.
export const toMaintenancePublicState = (state: MaintenanceState): MaintenancePublicState => ({
  id: state.id,
  status: state.status,
  bannerText: state.bannerText,
  reason: state.reason,
  level: state.level,
  maintenanceType: state.maintenanceType,
  etaDurationMins: state.etaDurationMins,
  etaEndsAt: state.etaEndsAt,
  affectedServices: state.affectedServices,
  // The public update text IS the update's reason — the status line over time.
  updates: state.updates.map((update) => ({
    id: update.id,
    displayText: update.reason,
    createdAt: update.createdAt,
  })),
  updatedAt: state.updatedAt,
});
