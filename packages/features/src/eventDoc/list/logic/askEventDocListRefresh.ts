import { AskResponse, askStateRead } from 'quidproquo-core';

import type { EventDocListState } from '../types/EventDocListState';
import { askEventDocListLoad } from './askEventDocListLoad';

/** Re-fetches the current page using the stored config. */
export function* askEventDocListRefresh(): AskResponse<void> {
  const { serviceName, basePath, listBasePath } = yield* askStateRead<EventDocListState>();
  yield* askEventDocListLoad(serviceName, listBasePath || basePath);
}
