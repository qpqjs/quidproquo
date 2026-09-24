import { QPQConfig } from 'quidproquo';

import { defineKeyValueStoreSmokeProbe } from '../suites/keyValueStore/config/defineKeyValueStoreSmokeProbe';
import { defineSigningKeySmokeProbe } from '../suites/signingKey/config/defineSigningKeySmokeProbe';
import { defineStorageDriveSmokeProbe } from '../suites/storageDrive/config/defineStorageDriveSmokeProbe';

/**
 * The cross-service half of the test service's smoke suites. Each folder under
 * suites/ mirrors the test service suite of the same name and exercises that
 * suite's foreign grant against a resource the test service owns.
 */
export const defineSmokeProbes = (): QPQConfig => [
  defineKeyValueStoreSmokeProbe(),
  defineStorageDriveSmokeProbe(),
  defineSigningKeySmokeProbe(),
];
