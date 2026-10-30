import { askDateNow, askPagedDataDrain, AskResponse, askSecondsElapsedFrom, LogLevelEnum, QpqPagedData } from '@qpqjs/core';

import { askLogLogList } from '../../data/logLogData';
import { LogLog } from '../../entry/domain';

const LOG_LOG_SEARCH_MAX_ITEMS = 3000;
const LOG_LOG_SEARCH_TIMEOUT_SECONDS = 15;

// Pages through the log lines from the caller's page key, stopping early once enough have
// been collected or the search has run too long; the unread page key comes back with them.
export function* askLogLogGetAll(
  logLevel: LogLevelEnum,
  startIsoDateTime: string,
  endIsoDateTime: string,
  serviceFilter: string,
  reasonFilter: string,
  nextPageKey?: string,
): AskResponse<QpqPagedData<LogLog>> {
  const startTime = yield* askDateNow();

  return yield* askPagedDataDrain(
    function* askLogLogPage(pageKey) {
      return yield* askLogLogList(logLevel, startIsoDateTime, endIsoDateTime, serviceFilter, reasonFilter, pageKey);
    },
    {
      startPageKey: nextPageKey,
      *askShouldContinue(collected) {
        return collected.length < LOG_LOG_SEARCH_MAX_ITEMS && (yield* askSecondsElapsedFrom(startTime)) < LOG_LOG_SEARCH_TIMEOUT_SECONDS;
      },
    },
  );
}
