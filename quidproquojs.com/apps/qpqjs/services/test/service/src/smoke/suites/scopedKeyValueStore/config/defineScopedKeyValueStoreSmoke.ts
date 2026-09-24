import { defineKeyValueStore, QPQConfig } from 'quidproquo';

import { SmokeProbeRecord } from '@qpqjs/test-models';

import { SMOKE_SCOPED_PROBE_STORE } from '../constants/SMOKE_SCOPED_PROBE_STORE';

/**
 * A scoped store: the scope gate in both directions (a scoped store refuses an
 * unscoped call, an unscoped one refuses a scope) and partition isolation
 * between two scopes, including through the category index.
 */
export const defineScopedKeyValueStoreSmoke = (): QPQConfig => [
  defineKeyValueStore<SmokeProbeRecord>(
    SMOKE_SCOPED_PROBE_STORE,
    'probeId',
    [],
    { indexes: ['category'], scoped: true }
  ),
];
