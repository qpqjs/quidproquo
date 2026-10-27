import { askDateNow, askNewGuid, AskResponse, askRunParallel, askStateRead, QpqRuntimeType } from 'quidproquo-core';

import { askUIVolatileLogSearchCompleted } from '../../actionCreators/volatile/askUIVolatileLogSearchCompleted';
import { askUIVolatileLogSearchStarted } from '../../actionCreators/volatile/askUIVolatileLogSearchStarted';
import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminAppState } from '../../AdminAppState';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { SearchRequestedData } from '../../effects/session/SearchRequestedEvent';
import { SearchOrigin } from '../../types/SearchOrigin';
import { selectSearchParams } from '../selectors/selectSearchParams';
import { askFetchLogSearchPart } from './askFetchLogSearchPart';
import { effectiveRuntimeType } from './effectiveRuntimeType';
import { logSearchKey } from './logSearchKey';

// The Search intent: recorded in the session doc, then fetched — one part per
// runtime type in parallel — into the volatile cache keyed by the raw params.
export function* askRunLogSearch(): AskResponse<void> {
  const state = yield* askStateRead<AdminAppState>('');
  const search = selectSearchParams(state);

  const requestId = yield* askNewGuid();
  yield* askApplySessionEvent<SearchRequestedData>(AdminSessionEventType.searchRequested, { search, requestId, origin: SearchOrigin.events });

  const runtimeType = effectiveRuntimeType(search);
  const runtimeTypes = runtimeType === 'ALL' ? Object.keys(QpqRuntimeType).sort() : [runtimeType];

  const searchKey = logSearchKey(search);
  yield* askUIVolatileLogSearchStarted(searchKey, runtimeTypes.length);

  const nowIso = yield* askDateNow();

  yield* askRunParallel(runtimeTypes.map((type) => askFetchLogSearchPart(searchKey, search, type, nowIso, !!search.error)));

  const fetchedAt = yield* askDateNow();
  yield* askUIVolatileLogSearchCompleted(searchKey, fetchedAt);
}
