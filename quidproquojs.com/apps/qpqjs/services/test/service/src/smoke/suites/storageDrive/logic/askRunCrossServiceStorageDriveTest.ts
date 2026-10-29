import { QpqjsServiceEnum, SMOKE_CROSS_SERVICE_STORAGE_DRIVE_PROBE_FUNCTION_NAME, SMOKE_PROBE_DRIVE } from '@qpqjs/constants';
import { CrossServiceProbePayload, CrossServiceStorageDriveProbeResult } from '@qpqjs/testa-models';
import { askFileDelete, askFileReadTextContents, askGuidNew, AskResponse, askServiceFunctionExecute } from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

// testa writes a file into the drive THIS service owns, through its foreign
// (exact-ARN) S3 grant. An error from inside testa is that grant; the
// read-back here proves the write landed in the same physical bucket.
export function* askRunCrossServiceStorageDriveTest(): AskResponse<void> {
  const probeId = yield* askGuidNew();

  const result = yield* askServiceFunctionExecute<CrossServiceStorageDriveProbeResult, CrossServiceProbePayload>(
    QpqjsServiceEnum.TestA,
    SMOKE_CROSS_SERVICE_STORAGE_DRIVE_PROBE_FUNCTION_NAME,
    { probeId },
  );

  const fileContents = yield* askFileReadTextContents(SMOKE_PROBE_DRIVE, result.filepath);
  yield* askSmokeAssert(fileContents === result.fileContents, 'file written by testa did not read back from our own drive');

  yield* askFileDelete(SMOKE_PROBE_DRIVE, [result.filepath]);
}
