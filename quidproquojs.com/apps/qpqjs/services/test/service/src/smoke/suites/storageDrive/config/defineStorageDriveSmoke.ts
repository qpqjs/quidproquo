import { defineStorageDrive, QPQConfig } from 'quidproquo';

import { SMOKE_PROBE_DRIVE } from '@qpqjs/constants';

/**
 * An owned drive. testa declares the same drive foreign (see its
 * smoke/suites/storageDrive) for the cross-service test, which is why the
 * name is app-level.
 */
export const defineStorageDriveSmoke = (): QPQConfig => [
  defineStorageDrive(SMOKE_PROBE_DRIVE),
];
