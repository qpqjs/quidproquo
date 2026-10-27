import { QpqIsoDateTime } from 'quidproquo-core';

import { MaintenanceLevel } from '../v1/types/MaintenanceLevel';
import { MaintenanceType } from '../v1/types/MaintenanceType';
import { MaintenanceState } from '../v1/views/document/MaintenanceState';

const MS_PER_MINUTE = 60_000;

// The updates list IS the document: after every add/edit/remove the top-level
// fields re-derive from the surviving list — the last update's status snapshot
// wins, and the eta carries over from the last update that ANNOUNCED one
// (etaSetAt set), so an update without an announcement inherits the running
// clock and deleting the newest update rolls everything back.
export const deriveMaintenanceCurrentState = (state: MaintenanceState): MaintenanceState => {
  const last = state.updates[state.updates.length - 1];
  const lastWithEta = [...state.updates].reverse().find((update) => update.etaSetAt !== null);

  const etaDurationMins = lastWithEta?.etaDurationMins ?? null;
  const etaSetAt = lastWithEta?.etaSetAt ?? null;

  return {
    ...state,
    bannerText: last?.bannerText || last?.reason || '',
    reason: last?.reason ?? '',
    level: last?.level ?? MaintenanceLevel.Low,
    maintenanceType: last?.maintenanceType ?? MaintenanceType.Deploy,
    affectedServices: last?.affectedServices ?? null,
    etaDurationMins,
    etaEndsAt:
      etaDurationMins === null || etaSetAt === null
        ? null
        : (new Date(new Date(etaSetAt).getTime() + etaDurationMins * MS_PER_MINUTE).toISOString() as QpqIsoDateTime),
  };
};
