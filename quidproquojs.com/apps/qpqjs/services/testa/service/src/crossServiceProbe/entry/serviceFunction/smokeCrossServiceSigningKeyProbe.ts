import { AskResponse, ExecuteServiceFunctionEvent } from 'quidproquo';

import {
  CrossServiceSigningKeyProbePayload,
  CrossServiceSigningKeyProbeResult,
} from '@qpqjs/testa-models';

import { askProbeForeignSigningKey } from '../../logic/askProbeForeignSigningKey';

// Service function entry, called cross-service by the test service's
// crossServiceSigningKey smoke test.
export function* smokeCrossServiceSigningKeyProbe(
  event: ExecuteServiceFunctionEvent<CrossServiceSigningKeyProbePayload>
): AskResponse<CrossServiceSigningKeyProbeResult> {
  return yield* askProbeForeignSigningKey(event.payload.token);
}
