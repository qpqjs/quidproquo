import {
  askKeyValueStoreUpsert,
  AskResponse,
  KvsStreamEventResponse,
  KvsStreamRecord,
} from 'quidproquo';

import { SMOKE_PROBE_STORE } from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';

import { smokeStreamMarkerId } from './smokeStreamMarkerId';

// Fan-in for the kvs stream test: the scoped stream store's changes land
// here. The marker records the scope the record carried and the raw key, so
// the test can check the stream hands back the scope as its own field with
// the key stripped of it.
export function* onSmokeStreamRecord(
  record: KvsStreamRecord<SmokeProbeRecord>
): AskResponse<KvsStreamEventResponse> {
  const key = String(record.keys.probeId);

  const marker: SmokeProbeRecord = {
    probeId: smokeStreamMarkerId(key, record.eventType),
    category: 'kvsStream',
    value: 1,
    scope: record.scope,
    path: key,
  };

  yield* askKeyValueStoreUpsert<SmokeProbeRecord>(SMOKE_PROBE_STORE, marker);
}
