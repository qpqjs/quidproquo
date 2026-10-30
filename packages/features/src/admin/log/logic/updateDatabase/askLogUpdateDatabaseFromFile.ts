import { addMillisecondsToTDateIso, askCatch, askFileReadObjectJson, askGetEpochStartTime, askMap, AskResponse, StoryResult } from '@qpqjs/core';

import { askActionSearchUpdateFromStoryResult } from '../../../actionSearch/logic/askActionSearchUpdateFromStoryResult';
import { askLogLogUpsert } from '../../data/logLogData';
import * as logMetadataData from '../../data/logMetadata';
import { LogLog } from '../../entry/domain';
import { redactStoryResult } from '../redaction/redactStoryResult';
import { askLogSendToAdmins } from '../webSocket';
import { storyResultToMetadata } from './utils/storyResultToMetadata';
import { askErrorReadingStoryResultToMetadata } from './askErrorReadingStoryResultToMetadata';
import { askLogGetInfosFromStoryResult } from './askLogGetInfosFromStoryResult';

export function* askLogUpdateDatabaseFromFile(storageDriveName: string, filesPath: string, ttl?: number): AskResponse<void> {
  const logObj = yield* askCatch(askFileReadObjectJson<StoryResult<any>>(storageDriveName, filesPath));

  // Every row derived below is admin-visible, so only the redacted object is indexed.
  const storyResult = logObj.success ? redactStoryResult(logObj.result) : null;

  const metadata = storyResult
    ? storyResultToMetadata(storyResult, ttl)
    : yield* askErrorReadingStoryResultToMetadata(filesPath.split('.').slice(0, -1).join('.'));

  yield* logMetadataData.askLogMetadataUpsert(metadata);

  // Send errors to admins
  if (metadata.error || !storyResult) {
    yield* askLogSendToAdmins(metadata);
  }

  if (!storyResult) {
    return;
  }

  const logActionHistories = yield* askLogGetInfosFromStoryResult(storyResult);
  let currentTime: string = yield* askGetEpochStartTime();
  const logLogs = logActionHistories.map((lac, logIndex) => {
    const timestamp = lac.startedAt === currentTime ? addMillisecondsToTDateIso(lac.startedAt, 1) : lac.startedAt;

    const logLog: LogLog = {
      type: lac.logLevel,
      reason: lac.msg,
      fromCorrelation: storyResult.correlation,
      module: storyResult.moduleName,
      logIndex,
      timestamp,
    };

    currentTime = timestamp;

    return logLog;
  });

  yield* askMap(logLogs, askLogLogUpsert);

  yield* askActionSearchUpdateFromStoryResult(storyResult, ttl);
}
