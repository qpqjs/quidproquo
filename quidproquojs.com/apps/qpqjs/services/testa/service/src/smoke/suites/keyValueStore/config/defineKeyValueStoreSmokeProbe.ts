import {
  defineKeyValueStore,
  defineServiceFunction,
  QPQConfig,
} from 'quidproquo';

import {
  QpqjsServiceEnum,
  SMOKE_CROSS_SERVICE_KEY_VALUE_STORE_PROBE_FUNCTION_NAME,
  SMOKE_PROBE_STORE,
} from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';

/**
 * The test service's probe store declared FOREIGN (owned by test), which is
 * what grants this service's role exact-ARN access to it, plus the service
 * function the test service's crossServiceKeyValueStore test invokes.
 */
export const defineKeyValueStoreSmokeProbe = (): QPQConfig => [
  defineKeyValueStore<SmokeProbeRecord>(SMOKE_PROBE_STORE, 'probeId', [], {
    indexes: ['category'],
    owner: { module: QpqjsServiceEnum.Test },
  }),
  defineServiceFunction(
    {
      basePath: __dirname,
      relativePath:
        '../entry/serviceFunction/smokeCrossServiceKeyValueStoreProbe',
      functionName: 'smokeCrossServiceKeyValueStoreProbe',
    },
    { functionName: SMOKE_CROSS_SERVICE_KEY_VALUE_STORE_PROBE_FUNCTION_NAME }
  ),
];
