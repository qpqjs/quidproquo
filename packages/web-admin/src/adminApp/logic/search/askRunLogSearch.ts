import { askDateNow, askGuidNew, AskResponse, askRunParallel, askStateRead, QpqRuntimeType } from '@qpqjs/core';

import { askVolatileLogSearchCompleted } from '../../actionCreators/volatile/askVolatileLogSearchCompleted';
import { askVolatileLogSearchStarted } from '../../actionCreators/volatile/askVolatileLogSearchStarted';
import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';
import { AdminSessionSearchRequestedData } from '../../effects/session/AdminSessionSearchRequestedEffect';
import { AdminAppState } from '../../types/AdminAppState';
import { SearchOrigin } from '../../types/SearchOrigin';
import { selectSearchParams } from '../selectors/selectSearchParams';
import { askFetchLogSearchPart } from './askFetchLogSearchPart';
import { effectiveRuntimeType } from './effectiveRuntimeType';
import { logSearchKey } from './logSearchKey';

// The Search intent: recorded in the session doc, then fetched, one part per
// runtime type in parallel, into the volatile cache keyed by the raw params.
export function* askRunLogSearch(): AskResponse<void> {
  const state = yield* askStateRead<AdminAppState>('');
  const search = selectSearchParams(state);

  const requestId = yield* askGuidNew();
  yield* askApplySessionEvent<AdminSessionSearchRequestedData>(AdminSessionEffect.SearchRequested, {
    search,
    requestId,
    origin: SearchOrigin.events,
  });

  const runtimeType = effectiveRuntimeType(search);
  const runtimeTypes = runtimeType === 'ALL' ? Object.keys(QpqRuntimeType).sort() : [runtimeType];

  const searchKey = logSearchKey(search);
  yield* askVolatileLogSearchStarted(searchKey, runtimeTypes.length);

  const nowIso = yield* askDateNow();

  yield* askRunParallel(runtimeTypes.map((type) => askFetchLogSearchPart(searchKey, search, type, nowIso, !!search.error)));

  const fetchedAt = yield* askDateNow();
  yield* askVolatileLogSearchCompleted(searchKey, fetchedAt);
}
