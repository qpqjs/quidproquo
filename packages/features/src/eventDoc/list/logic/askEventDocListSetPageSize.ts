import { AskResponse, askStateRead } from 'quidproquo-core';

import { askUIEventDocListSetPageSize } from '../actionCreators/askUIEventDocListSetPageSize';
import type { EventDocListState } from '../types/EventDocListState';
import { askEventDocListLoad } from './askEventDocListLoad';

/** Sets the page size and, when it changed, reloads: the reducer restarts the walk since the old cursors do not line up. */
export function* askEventDocListSetPageSize(pageSize: number): AskResponse<void> {
  const before = yield* askStateRead<EventDocListState>();

  yield* askUIEventDocListSetPageSize(pageSize);

  const after = yield* askStateRead<EventDocListState>();

  if (after.pageSize !== before.pageSize) {
    yield* askEventDocListLoad(after.serviceName, after.listBasePath || after.basePath);
  }
}
