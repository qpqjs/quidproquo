import { askConfigGetGlobal, askGetCurrentEpoch, askMap, AskResponse } from '@qpqjs/core';

import { ADMIN_LOG_RETENTION_DAYS_GLOBAL } from '../../../constants';
import { askLogUpdateDatabaseFromFile } from './askLogUpdateDatabaseFromFile';

export function* askLogUpdateDatabaseFromFiles(storageDriveName: string, filesPaths: string[]): AskResponse<void> {
  const logRetentionDays = yield* askConfigGetGlobal<number | undefined>(ADMIN_LOG_RETENTION_DAYS_GLOBAL);

  const ttl = logRetentionDays ? Math.floor((yield* askGetCurrentEpoch()) + logRetentionDays * 24 * 60 * 60) : undefined;

  yield* askMap(filesPaths, function* (filePath: string) {
    yield* askLogUpdateDatabaseFromFile(storageDriveName, filePath, ttl);
  });
}
