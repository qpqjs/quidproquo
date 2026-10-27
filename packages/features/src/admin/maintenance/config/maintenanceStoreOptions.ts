import { EventDocStoreOptions } from '../../../eventDoc/context/buildEventDocStore';
import { maintenanceDocType, maintenanceStoreName, QPQ_MAINTENANCE_ON_APPEND_FN } from '../constants/maintenanceConstants';

// The maintenance collection's store identity for code running OUTSIDE the mounted
// routes (the sync-on-connect service function). Must mirror the defineEventDoc
// registration in defineAdminSettings so custom and built-in access describe the
// identical store.
export const maintenanceStoreOptions: EventDocStoreOptions = {
  storeName: maintenanceStoreName,
  type: maintenanceDocType,
  onAppend: QPQ_MAINTENANCE_ON_APPEND_FN,
};
