import {
  defineCryptoKey,
  defineKeyValueStore,
  defineStorageDrive,
  QPQConfig,
} from 'quidproquo';

import { SmokeProbeRecord } from '@qpqjs/test-models';

import { SMOKE_CRYPTO_KEY } from '../constants/SMOKE_CRYPTO_KEY';
import { SMOKE_ENCRYPTED_PROBE_DRIVE } from '../constants/SMOKE_ENCRYPTED_PROBE_DRIVE';
import { SMOKE_ENCRYPTED_PROBE_STORE } from '../constants/SMOKE_ENCRYPTED_PROBE_STORE';

/**
 * A drive and a store encrypted with an owned crypto key, so the test proves
 * the role's KMS grant covers data at rest.
 */
export const defineEncryptedResourcesSmoke = (): QPQConfig => [
  defineCryptoKey(SMOKE_CRYPTO_KEY),
  defineKeyValueStore<SmokeProbeRecord>(
    SMOKE_ENCRYPTED_PROBE_STORE,
    'probeId',
    [],
    { cryptoKeyName: SMOKE_CRYPTO_KEY }
  ),
  defineStorageDrive(SMOKE_ENCRYPTED_PROBE_DRIVE, {
    cryptoKeyName: SMOKE_CRYPTO_KEY,
  }),
];
