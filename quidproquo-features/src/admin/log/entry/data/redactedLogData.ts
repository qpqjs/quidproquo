import {
  askFileExists,
  askFileIsColdStorage,
  askFileReadObjectJson,
  askFileWriteObjectJson,
  AskResponse,
  askThrowError,
  ErrorTypeEnum,
  Nullable,
  QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME,
  QPQ_LOGS_STORAGE_DRIVE_NAME,
  StoryResult,
} from 'quidproquo-core';

import { getRedactedLogFilePath } from '../../logic/redaction/getRedactedLogFilePath';
import { redactStoryResult } from '../../logic/redaction/redactStoryResult';

/**
 * Makes sure a redacted copy of the log exists on the reports drive and returns its path there.
 * Returns null when the raw log is in cold storage and no copy is cached. The reports drive
 * expires copies, so a miss rebuilds from the raw log; concurrent misses write identical content.
 */
export function* askEnsureRedactedLog(correlation: string): AskResponse<Nullable<string>> {
  const redactedPath = getRedactedLogFilePath(correlation);

  const cached = yield* askFileExists(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, redactedPath);
  if (cached) {
    return redactedPath;
  }

  const rawPath = `${correlation}.json`;
  const isColdStorage = yield* askFileIsColdStorage(QPQ_LOGS_STORAGE_DRIVE_NAME, rawPath);
  if (isColdStorage) {
    return null;
  }

  const storyResult = yield* askFileReadObjectJson<StoryResult<any>>(QPQ_LOGS_STORAGE_DRIVE_NAME, rawPath);
  yield* askFileWriteObjectJson(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, redactedPath, redactStoryResult(storyResult));

  return redactedPath;
}

/**
 * The only way admin-facing code reads a log body. Throws Invalid when the log is in cold storage
 * with no cached copy.
 */
export function* askGetRedactedByCorrelation(correlation: string): AskResponse<StoryResult<any>> {
  const redactedPath = yield* askEnsureRedactedLog(correlation);
  if (!redactedPath) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, 'Log is in cold storage');
  }

  return yield* askFileReadObjectJson<StoryResult<any>>(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, redactedPath);
}
