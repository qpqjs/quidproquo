import {
  askKeyValueStoreGet,
  askKeyValueStoreUpsert,
  AskResponse,
  askThrowError,
  ErrorTypeEnum,
} from 'quidproquo';

import { SMOKE_PROBE_STORE } from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';
import { CrossServiceKeyValueStoreProbeResult } from '@qpqjs/testa-models';

// Writes a row into the test service's probe store and reads it back, under
// THIS service's role: PutItem and GetItem through the foreign (exact-ARN)
// DynamoDB grant.
export function* askProbeForeignKeyValueStore(
  probeId: string
): AskResponse<CrossServiceKeyValueStoreProbeResult> {
  const record: SmokeProbeRecord = {
    probeId,
    category: 'crossService',
    value: 7,
  };

  yield* askKeyValueStoreUpsert<SmokeProbeRecord>(SMOKE_PROBE_STORE, record);

  const readRecord = yield* askKeyValueStoreGet<SmokeProbeRecord>(
    SMOKE_PROBE_STORE,
    probeId
  );
  if (!readRecord) {
    return yield* askThrowError(
      ErrorTypeEnum.NotFound,
      `foreign store row [${probeId}] did not read back`
    );
  }

  return { recordValue: readRecord.value };
}
