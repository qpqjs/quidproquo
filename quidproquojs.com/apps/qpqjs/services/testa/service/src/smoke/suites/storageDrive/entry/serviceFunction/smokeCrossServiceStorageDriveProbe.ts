import { AskResponse, ExecuteServiceFunctionEvent } from 'quidproquo';

import {
  CrossServiceProbePayload,
  CrossServiceStorageDriveProbeResult,
} from '@qpqjs/testa-models';

import { askProbeForeignStorageDrive } from '../../logic/askProbeForeignStorageDrive';

// Service function entry, called cross-service by the test service's
// crossServiceStorageDrive smoke test.
export function* smokeCrossServiceStorageDriveProbe(
  event: ExecuteServiceFunctionEvent<CrossServiceProbePayload>
): AskResponse<CrossServiceStorageDriveProbeResult> {
  return yield* askProbeForeignStorageDrive(event.payload.probeId);
}
