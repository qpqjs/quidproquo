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
} from 'quidproquo-core';

import { askListLogs } from '../../entry/data/logMetadataData';
import { LogMetadata } from '../../entry/domain';

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
          return logData.success ? logData.result : '';
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
