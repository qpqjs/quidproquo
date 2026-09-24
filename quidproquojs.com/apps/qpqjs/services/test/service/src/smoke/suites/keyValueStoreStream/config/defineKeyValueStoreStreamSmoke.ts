import { defineKeyValueStore, QPQConfig } from 'quidproquo';

import { SmokeProbeRecord } from '@qpqjs/test-models';

import { SMOKE_STREAM_PROBE_STORE } from '../constants/SMOKE_STREAM_PROBE_STORE';

/**
 * A change on this scoped store streams to the handler, which writes a marker
 * into the probe store for the test to poll. The record must carry the scope
 * as its own field with a raw key, and the category index's hidden copy must
 * not reach the handler.
 */
export const defineKeyValueStoreStreamSmoke = (): QPQConfig => [
  defineKeyValueStore<SmokeProbeRecord>(
    SMOKE_STREAM_PROBE_STORE,
    'probeId',
    [],
    {
      indexes: ['category'],
      scoped: true,
      onStream: {
        runtime: {
          basePath: __dirname,
          relativePath: '../entry/kvsStream/onSmokeStreamRecord',
          functionName: 'onSmokeStreamRecord',
        },
      },
    }
  ),
];
