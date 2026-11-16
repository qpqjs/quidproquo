import { askCatch, askLogCreate, askMapParallel, AskResponse, LogLevelEnum, Nullable } from '@qpqjs/core';

import { EventDocEvent, EventDocListViewState } from '../models';
import { askEventDocListViewNamesResolve } from './askEventDocListViewNamesResolve';
import { askEventDocListViewRefold } from './askEventDocListViewRefold';

/**
 * Bring every list view's row (the summary and each declared view) up to the events the caller has just appended,
 * side by side, and return each view's state by name. Never throws: a definition that cannot be read is logged, and
 * the rows are left to the stream projector.
 */
export function* askEventDocListViewsRefold(
  modelId: string,
  appended: EventDocEvent[],
  trusted: boolean,
): AskResponse<Record<string, Nullable<EventDocListViewState>>> {
  const viewNames = yield* askCatch(askEventDocListViewNamesResolve());

  if (!viewNames.success) {
    yield* askLogCreate(LogLevelEnum.Warn, `Could not read the list views of ${modelId}; the stream projector will refold them.`, viewNames.error);

    return {};
  }

  const states = yield* askMapParallel(viewNames.result, function* askRefoldOne(viewName: string) {
    return yield* askEventDocListViewRefold(modelId, viewName, appended, trusted);
  });

  return Object.fromEntries(viewNames.result.map((viewName, index) => [viewName, states[index] ?? null]));
}
