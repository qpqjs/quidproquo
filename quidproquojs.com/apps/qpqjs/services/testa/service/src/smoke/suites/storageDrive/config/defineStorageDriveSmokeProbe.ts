import {
  defineServiceFunction,
  defineStorageDrive,
  QPQConfig,
} from 'quidproquo';

import {
  QpqjsServiceEnum,
  SMOKE_CROSS_SERVICE_STORAGE_DRIVE_PROBE_FUNCTION_NAME,
  SMOKE_PROBE_DRIVE,
} from '@qpqjs/constants';

/**
 * The test service's probe drive declared FOREIGN (owned by test), which is
 * what grants this service's role exact-ARN access to it, plus the service
 * function the test service's crossServiceStorageDrive test invokes.
 */
export const defineStorageDriveSmokeProbe = (): QPQConfig => [
  defineStorageDrive(SMOKE_PROBE_DRIVE, {
    owner: { module: QpqjsServiceEnum.Test },
  }),
  defineServiceFunction(
    {
      basePath: __dirname,
      relativePath:
        '../entry/serviceFunction/smokeCrossServiceStorageDriveProbe',
      functionName: 'smokeCrossServiceStorageDriveProbe',
    },
    { functionName: SMOKE_CROSS_SERVICE_STORAGE_DRIVE_PROBE_FUNCTION_NAME }
  ),
];
