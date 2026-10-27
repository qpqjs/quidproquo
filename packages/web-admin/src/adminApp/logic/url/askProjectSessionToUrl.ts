import { AskResponse, askStateRead } from 'quidproquo-core';
import { askQueryParamsGetAll, askQueryParamsSet } from 'quidproquo-web';

import { AdminAppState } from '../../AdminAppState';
import { selectUrlProjection } from '../selectors/selectUrlProjection';

// Pushes the session state's URL projection into the address bar (replaceState;
// no history spam) — only params whose value actually changed are written.
export function* askProjectSessionToUrl(): AskResponse<void> {
  const state = yield* askStateRead<AdminAppState>('');
  const projection = selectUrlProjection(state);
  const current = yield* askQueryParamsGetAll();

  for (const [key, values] of Object.entries(projection)) {
    const currentValues = current[key] ?? [];

    if (currentValues.join(' ') !== values.join(' ')) {
      yield* askQueryParamsSet(key, values);
    }
  }
}
