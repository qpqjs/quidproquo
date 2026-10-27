import { askDateNow, askNewGuid, AskResponse, askRunParallel, QpqRuntimeType } from 'quidproquo-core';

import { askUIVolatileLogSearchCompleted } from '../../actionCreators/volatile/askUIVolatileLogSearchCompleted';
import { askUIVolatileLogSearchStarted } from '../../actionCreators/volatile/askUIVolatileLogSearchStarted';
import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { createDefaultAdminSearchParams } from '../../AdminSessionState';
import { dashboardErrorsSearchKey } from '../../constants/dashboardErrorsSearchKey';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { SearchRequestedData } from '../../effects/session/SearchRequestedEvent';
import { AdminSearchParams } from '../../types/AdminSearchParams';
import { SearchOrigin } from '../../types/SearchOrigin';
import { askFetchLogSearchPart } from '../search/askFetchLogSearchPart';

const DAY_MS = 24 * 60 * 60 * 1000;

// The Dashboard's automatic error sweep: recorded in the session doc (origin
// dashboard, so it never overwrites the user's own filters), then fetched
// across all runtime types with onlyErrors on.
export function* askRunDashboardErrorSearch(): AskResponse<void> {
  const nowIso = yield* askDateNow();
  const now = new Date(nowIso);

  const search: AdminSearchParams = {
    ...createDefaultAdminSearchParams(),
    runtimeType: 'ALL',
    startIsoDateTime: new Date(now.getTime() - 7 * DAY_MS).toISOString(),
    endIsoDateTime: new Date(now.getTime() + DAY_MS).toISOString(),
  };

  const requestId = yield* askNewGuid();
  yield* askApplySessionEvent<SearchRequestedData>(AdminSessionEventType.searchRequested, { search, requestId, origin: SearchOrigin.dashboard });

  const runtimeTypes = Object.keys(QpqRuntimeType).sort();
  yield* askUIVolatileLogSearchStarted(dashboardErrorsSearchKey, runtimeTypes.length);

  yield* askRunParallel(runtimeTypes.map((type) => askFetchLogSearchPart(dashboardErrorsSearchKey, search, type, nowIso, true)));

  const fetchedAt = yield* askDateNow();
  yield* askUIVolatileLogSearchCompleted(dashboardErrorsSearchKey, fetchedAt);
}
