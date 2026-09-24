import { AskResponse, ExecuteServiceFunctionEvent } from 'quidproquo';

import {
  CrossServiceKeyValueStoreProbeResult,
  CrossServiceProbePayload,
} from '@qpqjs/testa-models';

import { askProbeForeignKeyValueStore } from '../../logic/askProbeForeignKeyValueStore';

// Service function entry, called cross-service by the test service's
// crossServiceKeyValueStore smoke test.
export function* smokeCrossServiceKeyValueStoreProbe(
  event: ExecuteServiceFunctionEvent<CrossServiceProbePayload>
): AskResponse<CrossServiceKeyValueStoreProbeResult> {
  return yield* askProbeForeignKeyValueStore(event.payload.probeId);
}
