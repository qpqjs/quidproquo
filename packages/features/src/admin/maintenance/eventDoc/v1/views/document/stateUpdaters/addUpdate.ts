import { EventDocEventPayload } from '../../../../../../../eventDoc/models/EventDocEventPayload';
import { deriveMaintenanceCurrentState } from '../../../../logic/deriveMaintenanceCurrentState';
import { hasEtaAnnouncement } from '../../../../logic/hasEtaAnnouncement';
import { MaintenanceUpdateData } from '../../../events/effects/MaintenanceUpdateData';
import { MaintenanceLevel } from '../../../types/MaintenanceLevel';
import { MaintenanceType } from '../../../types/MaintenanceType';
import { MaintenanceState } from '../MaintenanceState';
import { MaintenanceUpdateEntry } from '../MaintenanceUpdateEntry';

// Append one full status snapshot; provenance (timestamps, author) comes off the
// event's server-stamped metadata so every fold agrees. The `??` fallbacks keep
// pre-snapshot-era events folding without throwing.
export const addUpdate = (state: MaintenanceState, { data, metadata }: EventDocEventPayload<MaintenanceUpdateData>): MaintenanceState => {
  const entry: MaintenanceUpdateEntry = {
    id: data.updateId,
    bannerText: data.bannerText ?? '',
    reason: data.reason ?? '',
    level: data.level ?? MaintenanceLevel.Low,
    maintenanceType: data.maintenanceType ?? MaintenanceType.Deploy,
    affectedServices: data.affectedServices ?? null,
    internalNotes: data.internalNotes ?? '',
    etaDurationMins: hasEtaAnnouncement(data) ? (data.etaDurationMins ?? null) : null,
    etaSetAt: hasEtaAnnouncement(data) ? metadata.createdAt : null,
    createdAt: metadata.createdAt,
    updatedAt: null,
    createdByDisplayName: metadata.createdBy.userDisplayName,
  };

  return deriveMaintenanceCurrentState({ ...state, updates: [...state.updates, entry] });
};
