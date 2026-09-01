import {
  askFileReadTextContents,
  askFileWriteTextContents,
  AskResponse,
} from 'quidproquo';

import { SMOKE_PROBE_DRIVE } from '@qpqjs/constants';
import { CrossServiceStorageDriveProbeResult } from '@qpqjs/testa-models';

// Writes a file into the test service's probe drive and reads it back, under
// THIS service's role: PutObject and GetObject through the foreign
// (exact-ARN) S3 grant.
export function* askProbeForeignStorageDrive(
  probeId: string
): AskResponse<CrossServiceStorageDriveProbeResult> {
  const filepath = `cross/${probeId}.txt`;

  yield* askFileWriteTextContents(
    SMOKE_PROBE_DRIVE,
    filepath,
    `cross probe ${probeId}`
  );

  const fileContents = yield* askFileReadTextContents(
    SMOKE_PROBE_DRIVE,
    filepath
  );

  return { filepath, fileContents };
}
