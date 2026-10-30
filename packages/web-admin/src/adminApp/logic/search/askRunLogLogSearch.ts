import {
  askCatch,
  askDateNow,
  askGuidNew,
  AskResponse,
  askRunParallel,
  askStateRead,
  EitherActionResult,
  HTTPNetworkResponse,
  LogLevelEnum,
  LogLevelEnumLookup,
  QpqPagedData,
  resolveLookupValues,
} from '@qpqjs/core';
import { LogLog } from '@qpqjs/features';

import { askPlatformRequest } from '../../../platformLogic/network/askPlatformRequest';
import { askVolatileLogLogSearchCompleted } from '../../actionCreators/volatile/askVolatileLogLogSearchCompleted';
import { askVolatileLogLogSearchPartLoaded } from '../../actionCreators/volatile/askVolatileLogLogSearchPartLoaded';
import { askVolatileLogLogSearchStarted } from '../../actionCreators/volatile/askVolatileLogLogSearchStarted';
import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';
import { AdminSessionSearchRequestedData } from '../../effects/session/AdminSessionSearchRequestedEffect';
import { AdminAppState } from '../../types/AdminAppState';
import { AdminSearchParams } from '../../types/AdminSearchParams';
import { SearchOrigin } from '../../types/SearchOrigin';
import { selectSearchParams } from '../selectors/selectSearchParams';
import { effectiveLogLevelLookup } from './effectiveLogLevelLookup';
import { logLogSearchKey } from './logLogSearchKey';

// One search part = the full page-loop for one log level.
function* askFetchLogLogSearchPart(searchKey: string, search: AdminSearchParams, logLevel: LogLevelEnum, nowIso: string): AskResponse<void> {
  let logLogs: LogLog[] = [];
  let nextPageKey: string | undefined = undefined;

  do {
    const response: EitherActionResult<HTTPNetworkResponse<QpqPagedData<LogLog>>> = yield* askCatch(
      askPlatformRequest<QpqPagedData<LogLog>, unknown>('POST', '/loglog/list', {
        body: {
          logLevel,
          startIsoDateTime: search.startIsoDateTime || nowIso,
          endIsoDateTime: search.endIsoDateTime || nowIso,
          serviceFilter: search.service,
          reasonFilter: search.msg,
          nextPageKey,
        },
      }),
    );

    if (!response.success || response.result.status < 200 || response.result.status >= 300) {
      break;
    }

    logLogs = [...logLogs, ...response.result.data.items];
    nextPageKey = response.result.data.nextPageKey;
  } while (nextPageKey);

  yield* askVolatileLogLogSearchPartLoaded(searchKey, logLogs);
}

// The Logs-tab search intent: recorded in the session doc, then fetched, one
// part per resolved log level in parallel, into the volatile cache.
export function* askRunLogLogSearch(): AskResponse<void> {
  const state = yield* askStateRead<AdminAppState>('');
  const search = selectSearchParams(state);

  const requestId = yield* askGuidNew();
  yield* askApplySessionEvent<AdminSessionSearchRequestedData>(AdminSessionEffect.SearchRequested, { search, requestId, origin: SearchOrigin.logs });

  const logLevels = resolveLookupValues([effectiveLogLevelLookup(search) as LogLevelEnumLookup], LogLevelEnum);

  const searchKey = logLogSearchKey(search);
  yield* askVolatileLogLogSearchStarted(searchKey, logLevels.length);

  const nowIso = yield* askDateNow();

  yield* askRunParallel(logLevels.map((logLevel) => askFetchLogLogSearchPart(searchKey, search, logLevel, nowIso)));

  const fetchedAt = yield* askDateNow();
  yield* askVolatileLogLogSearchCompleted(searchKey, fetchedAt);
}
