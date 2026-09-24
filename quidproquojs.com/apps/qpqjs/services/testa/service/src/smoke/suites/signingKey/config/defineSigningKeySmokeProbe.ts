import { defineServiceFunction, defineSigningKey, QPQConfig } from 'quidproquo';

import {
  QpqjsServiceEnum,
  SMOKE_CROSS_SERVICE_SIGNING_KEY_PROBE_FUNCTION_NAME,
  SMOKE_PROBE_SIGNING_KEY,
} from '@qpqjs/constants';

/**
 * The test service's signing key declared FOREIGN (owned by test), plus the
 * service function the test service's crossServiceSigningKey test invokes.
 * The one foreign grant that is alias-conditioned rather than exact-ARN: the
 * owner's alias name is what this declaration must resolve to, or
 * GetPublicKey is denied.
 */
export const defineSigningKeySmokeProbe = (): QPQConfig => [
  defineSigningKey(SMOKE_PROBE_SIGNING_KEY, {
    owner: { module: QpqjsServiceEnum.Test },
  }),
  defineServiceFunction(
    {
      basePath: __dirname,
      relativePath: '../entry/serviceFunction/smokeCrossServiceSigningKeyProbe',
      functionName: 'smokeCrossServiceSigningKeyProbe',
    },
    { functionName: SMOKE_CROSS_SERVICE_SIGNING_KEY_PROBE_FUNCTION_NAME }
  ),
];
