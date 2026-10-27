// The maintenance event-doc collection (owned by the admin/log service).
export const maintenanceStoreName = 'qpq-maintenance';
export const maintenanceDocType = 'maintenance';
export const maintenanceBasePath = '/maintenance';

// Schema version maintenance events are authored at (fold migration target).
export const MAINTENANCE_SCHEMA_VERSION = 1;

// Inline function fired after every maintenance append — broadcasts the active
// public folds over the application websocket.
export const QPQ_MAINTENANCE_ON_APPEND_FN = 'qpqMaintenanceOnAppend';

// Inline function the application websocket invokes as soon as a connection
// opens (pre-auth — maintenance state is public) — syncs the active
// maintenance state to that connection.
export const QPQ_MAINTENANCE_WS_SYNC_FN = 'qpqMaintenanceWsConnectedSync';

// Admin-owned service function returning the active maintenance public folds
// (callable cross-service, e.g. from the websocket lambda's sync hook).
export const QPQ_GET_ACTIVE_MAINTENANCES_FUNCTION_NAME = 'qpqGetActiveMaintenances';

// Global naming the admin service module, set app-wide by defineAdminSettings so
// any service (e.g. the websocket lambda) can service-function-call the admin.
export const QPQ_ADMIN_SERVICE_NAME_GLOBAL = 'qpq-admin-service-name';
