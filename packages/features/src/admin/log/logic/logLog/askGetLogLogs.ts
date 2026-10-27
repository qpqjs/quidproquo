import { askDateNow, AskResponse, askSecondsElapsedFrom, LogLevelEnum, LogLevelEnumLookup, QpqPagedData } from 'quidproquo-core';

import { askListLogLogs } from '../../entry/data/logLogData';
import { LogLog } from '../../entry/domain';

export function* askGetLogLogs(
  logLevel: LogLevelEnum,
  startIsoDateTime: string,
  endIsoDateTime: string,
  serviceFilter: string,
  reasonFilter: string,
  nextPageKey?: string,
): AskResponse<QpqPagedData<LogLog>> {
  const result: QpqPagedData<LogLog> = {
    items: [],
    nextPageKey: nextPageKey,
  };

  const startTime = yield* askDateNow();

  do {
    const logPage = yield* askListLogLogs(logLevel, startIsoDateTime, endIsoDateTime, serviceFilter, reasonFilter, result.nextPageKey);

    result.items.push(...logPage.items);
    result.nextPageKey = logPage.nextPageKey;

    // Keep going until we get some items, if there are some to fetch, also break out if this has been running longer then 15 seconds.
  } while (result.nextPageKey && result.items.length < 3000 && (yield* askSecondsElapsedFrom(startTime)) < 15);

  return result;
}
