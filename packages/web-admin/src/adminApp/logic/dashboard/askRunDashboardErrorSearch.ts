import { askDateNow, askNewGuid, AskResponse, askRunParallel, QpqRuntimeType } from '@qpqjs/core';

import { askVolatileLogSearchCompleted } from '../../actionCreators/volatile/askVolatileLogSearchCompleted';
import { askVolatileLogSearchStarted } from '../../actionCreators/volatile/askVolatileLogSearchStarted';
import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { dashboardErrorsSearchKey } from '../../constants/dashboardErrorsSearchKey';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';
import { AdminSessionSearchRequestedData } from '../../effects/session/AdminSessionSearchRequestedEffect';
import { createDefaultAdminSearchParams } from '../../logic/createDefaultAdminSearchParams';
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
  yield* askApplySessionEvent<AdminSessionSearchRequestedData>(AdminSessionEffect.SearchRequested, {
    search,
    requestId,
    origin: SearchOrigin.dashboard,
  });

  const runtimeTypes = Object.keys(QpqRuntimeType).sort();
  yield* askVolatileLogSearchStarted(dashboardErrorsSearchKey, runtimeTypes.length);

  yield* askRunParallel(runtimeTypes.map((type) => askFetchLogSearchPart(dashboardErrorsSearchKey, search, type, nowIso, true)));

  const fetchedAt = yield* askDateNow();
  yield* askVolatileLogSearchCompleted(dashboardErrorsSearchKey, fetchedAt);
}
