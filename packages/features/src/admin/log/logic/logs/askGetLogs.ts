import {
  askCatch,
  askDateNow,
  askFileReadTextContents,
  askFilter,
  askMapParallelBatch,
  AskResponse,
  askSecondsElapsedFrom,
  QPQ_LOGS_STORAGE_DRIVE_NAME,
  QpqPagedData,
  QpqRuntimeType,
  StoryResult,
} from '@qpqjs/core';

import { askListLogs } from '../../entry/data/logMetadataData';
import { LogMetadata } from '../../entry/domain';
import { redactStoryResult } from '../redaction/redactStoryResult';

// The deep filter is a substring oracle over the log text, so it has to run over the same redacted log the admin
// can read, never the raw file. Anything that is not a story result is unsearchable.
const toSearchableLogText = (rawLogText: string): string => {
  try {
    return JSON.stringify(redactStoryResult(JSON.parse(rawLogText) as StoryResult<any>));
  } catch {
    return '';
  }
};

export function* askGetLogs(
  runtimeType: QpqRuntimeType,
  startIsoDateTime: string,
  endIsoDateTime: string,
  errorFilter: string,
  serviceFilter: string,
  infoFilter: string,
  userFilter: string,
  deep: string,
  onlyErrors: boolean,
  nextPageKey?: string,
): AskResponse<QpqPagedData<LogMetadata>> {
  const result: QpqPagedData<LogMetadata> = {
    items: [],
    nextPageKey: nextPageKey,
  };

  const startTime = yield* askDateNow();

  do {
    const logPage = yield* askListLogs(
      runtimeType,
      startIsoDateTime,
      endIsoDateTime,
      errorFilter,
      serviceFilter,
      infoFilter,
      userFilter,
      onlyErrors,
      result.nextPageKey,
    );

    const data = deep
      ? yield* askMapParallelBatch(logPage.items, 10, function* askFilterDeep(log): AskResponse<string> {
          const logData = yield* askCatch(askFileReadTextContents(QPQ_LOGS_STORAGE_DRIVE_NAME, `${log.correlation}.json`));
          return logData.success ? toSearchableLogText(logData.result) : '';
        })
      : [];

    const filtered = deep
      ? yield* askFilter(logPage.items, function* askFilterDeep(log, index) {
          return data[index].includes(deep);
        })
      : logPage.items;

    result.items.push(...filtered);
    result.nextPageKey = logPage.nextPageKey;

    // Keep going until we get some items, if there are some to fetch, also break out if this has been running longer then 15 seconds.
  } while (result.nextPageKey && result.items.length < 3000 && (yield* askSecondsElapsedFrom(startTime)) < 15);

  return result;
}
