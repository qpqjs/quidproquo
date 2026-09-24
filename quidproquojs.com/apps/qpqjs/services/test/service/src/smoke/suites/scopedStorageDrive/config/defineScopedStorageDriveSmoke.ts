import { defineStorageDrive, QPQConfig } from 'quidproquo';

import { SMOKE_SCOPED_PROBE_DRIVE } from '../constants/SMOKE_SCOPED_PROBE_DRIVE';

/**
 * A scoped drive for the scope gate in both directions (it refuses an unscoped
 * call, the harness's unscoped probe drive refuses a scope) and partition
 * isolation between two scopes.
 */
export const defineScopedStorageDriveSmoke = (): QPQConfig => [
  defineStorageDrive(SMOKE_SCOPED_PROBE_DRIVE, { scoped: true }),
];
