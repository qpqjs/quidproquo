import {
  defineKeyValueStore,
  defineServiceFunction,
  defineStorageDrive,
  QPQConfig,
} from 'quidproquo';

import {
  QpqjsServiceEnum,
  SMOKE_CROSS_SERVICE_KEY_VALUE_STORE_PROBE_FUNCTION_NAME,
  SMOKE_CROSS_SERVICE_STORAGE_DRIVE_PROBE_FUNCTION_NAME,
  SMOKE_PROBE_DRIVE,
  SMOKE_PROBE_STORE,
} from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';

// The test service's probe store and drive, declared here as FOREIGN (owned
// by test). That declaration is what makes the deploy grant this service's
// role exact-ARN access to them: the cross-service half of the IAM grants,
// which the tag-conditioned owned-resource statements never cover.
export const defineCrossServiceProbe = (): QPQConfig => {
  const owner = { module: QpqjsServiceEnum.Test };

  return [
    defineKeyValueStore<SmokeProbeRecord>(SMOKE_PROBE_STORE, 'probeId', [], {
      indexes: ['category'],
      owner,
    }),
    defineStorageDrive(SMOKE_PROBE_DRIVE, { owner }),

    // One service function per foreign grant, invoked by the test service's
    // crossService* smoke tests.
    defineServiceFunction(
      {
        basePath: __dirname,
        relativePath:
          '../entry/serviceFunction/smokeCrossServiceKeyValueStoreProbe',
        functionName: 'smokeCrossServiceKeyValueStoreProbe',
      },
      { functionName: SMOKE_CROSS_SERVICE_KEY_VALUE_STORE_PROBE_FUNCTION_NAME }
    ),
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
};
