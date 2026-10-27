import {
  askCatch,
  askDateNow,
  askNewGuid,
  AskResponse,
  askRunParallel,
  askStateRead,
  EitherActionResult,
  HTTPNetworkResponse,
  LogLevelEnum,
  LogLevelEnumLookup,
  QpqPagedData,
  resolveLookupValues,
} from 'quidproquo-core';
import { LogLog } from 'quidproquo-features';

import { askPlatformRequest } from '../../../platformLogic/network/askPlatformRequest';
import { askUIVolatileLogLogSearchCompleted } from '../../actionCreators/volatile/askUIVolatileLogLogSearchCompleted';
import { askUIVolatileLogLogSearchPartLoaded } from '../../actionCreators/volatile/askUIVolatileLogLogSearchPartLoaded';
import { askUIVolatileLogLogSearchStarted } from '../../actionCreators/volatile/askUIVolatileLogLogSearchStarted';
import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminAppState } from '../../AdminAppState';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { SearchRequestedData } from '../../effects/session/SearchRequestedEvent';
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
      askPlatformRequest<unknown, QpqPagedData<LogLog>>('POST', '/loglog/list', {
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

  yield* askUIVolatileLogLogSearchPartLoaded(searchKey, logLogs);
}

// The Logs-tab search intent: recorded in the session doc, then fetched — one
// part per resolved log level in parallel — into the volatile cache.
export function* askRunLogLogSearch(): AskResponse<void> {
  const state = yield* askStateRead<AdminAppState>('');
  const search = selectSearchParams(state);

  const requestId = yield* askNewGuid();
  yield* askApplySessionEvent<SearchRequestedData>(AdminSessionEventType.searchRequested, { search, requestId, origin: SearchOrigin.logs });

  const logLevels = resolveLookupValues([effectiveLogLevelLookup(search) as LogLevelEnumLookup], LogLevelEnum);

  const searchKey = logLogSearchKey(search);
  yield* askUIVolatileLogLogSearchStarted(searchKey, logLevels.length);

  const nowIso = yield* askDateNow();

  yield* askRunParallel(logLevels.map((logLevel) => askFetchLogLogSearchPart(searchKey, search, logLevel, nowIso)));

  const fetchedAt = yield* askDateNow();
  yield* askUIVolatileLogLogSearchCompleted(searchKey, fetchedAt);
}
