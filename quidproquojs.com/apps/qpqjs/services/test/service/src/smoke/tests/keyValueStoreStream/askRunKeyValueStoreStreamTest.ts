import {
  askKeyValueStoreDelete,
  askKeyValueStoreUpsert,
  askNewGuid,
  AskResponse,
  KvsStreamEventType,
} from 'quidproquo';

import { SmokeProbeRecord } from '@qpqjs/test-models';

import { SMOKE_STREAM_PROBE_STORE } from '../../constants/smokeProbe';
import { smokeStreamMarkerId } from '../../kvsStream/smokeStreamMarkerId';
import { askSmokeAssert } from '../askSmokeAssert';
import { askSmokePollForMarker } from '../askSmokePollForMarker';

// The kvs stream path end to end on a scoped store: an upsert streams an
// Insert and a delete streams a Remove to the handler. On dynamo the scope is
// composed into the stored partition key, so the record must hand it back as
// its own field with the key stripped, the same as the dev server does.
export function* askRunKeyValueStoreStreamTest(): AskResponse<void> {
  const probeId = yield* askNewGuid();
  const scope = `smoke-st-${probeId}`;

  const record: SmokeProbeRecord = {
    probeId,
    category: 'stream',
    value: 1,
  };
  yield* askKeyValueStoreUpsert<SmokeProbeRecord>(
    SMOKE_STREAM_PROBE_STORE,
    record,
    { scope }
  );

  const inserted = yield* askSmokePollForMarker(
    smokeStreamMarkerId(probeId, KvsStreamEventType.Insert),
    'the kvs stream insert'
  );
  yield* askSmokeAssert(
    inserted.scope === scope,
    `stream insert carried scope [${inserted.scope}], expected [${scope}]`
  );
  yield* askSmokeAssert(
    inserted.path === probeId,
    `stream insert key [${inserted.path}] was not the raw key`
  );

  yield* askKeyValueStoreDelete(SMOKE_STREAM_PROBE_STORE, probeId, undefined, {
    scope,
  });

  const removed = yield* askSmokePollForMarker(
    smokeStreamMarkerId(probeId, KvsStreamEventType.Remove),
    'the kvs stream remove'
  );
  yield* askSmokeAssert(
    removed.scope === scope && removed.path === probeId,
    'stream remove did not carry the scope and raw key'
  );
}
