import {
  askKeyValueStoreDelete,
  askKeyValueStoreGet,
  askNewGuid,
  AskResponse,
  askServiceFunctionExecute,
} from 'quidproquo';

import {
  QpqjsServiceEnum,
  SMOKE_CROSS_SERVICE_KEY_VALUE_STORE_PROBE_FUNCTION_NAME,
  SMOKE_PROBE_STORE,
} from '@qpqjs/constants';
import { SmokeProbeRecord } from '@qpqjs/test-models';
import {
  CrossServiceKeyValueStoreProbeResult,
  CrossServiceProbePayload,
} from '@qpqjs/testa-models';

import { askSmokeAssert } from '../askSmokeAssert';

// testa writes a row into the store THIS service owns, through its foreign
// (exact-ARN) DynamoDB grant. An error from inside testa is that grant; the
// read-back here proves the write landed on the same physical table.
export function* askRunCrossServiceKeyValueStoreTest(): AskResponse<void> {
  const probeId = yield* askNewGuid();

  const result = yield* askServiceFunctionExecute<
    CrossServiceKeyValueStoreProbeResult,
    CrossServiceProbePayload
  >(
    QpqjsServiceEnum.TestA,
    SMOKE_CROSS_SERVICE_KEY_VALUE_STORE_PROBE_FUNCTION_NAME,
    { probeId }
  );

  const record = yield* askKeyValueStoreGet<SmokeProbeRecord>(
    SMOKE_PROBE_STORE,
    probeId
  );
  yield* askSmokeAssert(
    record?.value === result.recordValue,
    'row written by testa did not read back from our own store'
  );

  yield* askKeyValueStoreDelete(SMOKE_PROBE_STORE, probeId);
}
