// Smoke probe resources owned by the test service and reached cross-service
// by testa (which declares them with owner: { module: test }). App-level
// because both services must agree on the names.
export const SMOKE_PROBE_STORE = 'smokeProbe';
export const SMOKE_PROBE_DRIVE = 'smokeProbe';

// The testa service functions the cross-service smoke tests invoke, one per
// foreign grant (the store and the drive are separate IAM statements).
export const SMOKE_CROSS_SERVICE_KEY_VALUE_STORE_PROBE_FUNCTION_NAME =
  'crossKvsProbe';
export const SMOKE_CROSS_SERVICE_STORAGE_DRIVE_PROBE_FUNCTION_NAME =
  'crossDriveProbe';
