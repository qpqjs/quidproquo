import { EventDocEventPayload } from '../../../../../../../eventDoc/models/EventDocEventPayload';
import { deriveMaintenanceCurrentState } from '../../../../logic/deriveMaintenanceCurrentState';
import { hasEtaAnnouncement } from '../../../../logic/hasEtaAnnouncement';
import { MaintenanceUpdateData } from '../../../events/effects/MaintenanceUpdateData';
import { MaintenanceState } from '../MaintenanceState';

// An edit that CHANGES the eta re-anchors that entry's clock to the edit's own
// timestamp (it is a fresh announcement); an edit that omits the eta leaves the
// entry's announcement untouched.
export const editUpdate = (state: MaintenanceState, { data, metadata }: EventDocEventPayload<MaintenanceUpdateData>): MaintenanceState => {
  const updates = state.updates.map((update) =>
    update.id === data.updateId
      ? {
          ...update,
          bannerText: data.bannerText ?? update.bannerText,
          reason: data.reason ?? update.reason,
          level: data.level ?? update.level,
          maintenanceType: data.maintenanceType ?? update.maintenanceType,
          affectedServices: data.affectedServices === undefined ? update.affectedServices : data.affectedServices,
          internalNotes: data.internalNotes ?? update.internalNotes,
          etaDurationMins: hasEtaAnnouncement(data) ? (data.etaDurationMins ?? null) : update.etaDurationMins,
          etaSetAt: hasEtaAnnouncement(data) ? metadata.createdAt : update.etaSetAt,
          updatedAt: metadata.createdAt,
        }
      : update,
  );

  return deriveMaintenanceCurrentState({ ...state, updates });
};
