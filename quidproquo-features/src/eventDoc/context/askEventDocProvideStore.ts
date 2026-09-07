import { AskResponse } from 'quidproquo-core';

import { askEventDocStoreProvide } from './askEventDocStoreProvide';
import { buildEventDocStore, EventDocStoreOptions } from './buildEventDocStore';

/** Provides the EventDoc store context for a custom route (outside `defineEventDocRoutes`) so the `askEventDoc*` data functions work. */
export function* askEventDocProvideStore<T>(options: EventDocStoreOptions, story: AskResponse<T>): AskResponse<T> {
  return yield* askEventDocStoreProvide(buildEventDocStore(options), story);
}
