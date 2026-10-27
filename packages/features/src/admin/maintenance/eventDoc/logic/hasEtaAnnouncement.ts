import { MaintenanceUpdateData } from '../v1/events/effects/MaintenanceUpdateData';

// An update ANNOUNCES an eta only when the field is present — absent means the
// running clock carries over untouched (null is an announcement too: "unknown").
export const hasEtaAnnouncement = (data: MaintenanceUpdateData): boolean => data.etaDurationMins !== undefined;
