import { askMapParallel, AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import { askValidateModelOrThrowError } from '../../validation/askValidateModelOrThrowError';
import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { EVENT_DOC_SUMMARY_VIEW } from '../definition/types/EventDocLatestViews';
import { EventDocEventActor, EventDocSummary, EventDocSummaryView, eventDocSummaryViewSchema } from '../models';
import { askEventDocGenerateNewId } from './askEventDocGenerateNewId';
import { askEventDocListViewAdvance } from './askEventDocListViewAdvance';
import { askEventDocListViewNamesResolve } from './askEventDocListViewNamesResolve';
import { askEventDocSeedInitState } from './askEventDocSeedInitState';

/**
 * Create a model: seed the INIT_STATE event that opens its log, then write the first row of every list view (the
 * summary and each declared one) from it, through the same fold every later append uses. Unlike an append, a row that
 * cannot be written fails the create. Pass `id` when the caller must know it before the write, e.g. to provide a
 * storage scope derived from it.
 */
export function* askEventDocCreate(name: string, code: string, actor: EventDocEventActor, id?: string): AskResponse<EventDocSummary> {
  const { type } = yield* askEventDocStoreReadOrThrow();
  const docId = id ?? (yield* askEventDocGenerateNewId());

  const initEvent = yield* askEventDocSeedInitState(docId, code, name, actor);
  const viewNames = yield* askEventDocListViewNamesResolve();

  // INIT_STATE is authored here, not by a caller, so it is folded as trusted.
  const states = yield* askMapParallel(viewNames, function* askWriteFirstRow(viewName: string) {
    return yield* askEventDocListViewAdvance(docId, viewName, [initEvent], true);
  });

  const summary = states[viewNames.indexOf(EVENT_DOC_SUMMARY_VIEW)];

  if (!summary) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Could not fold the summary of new ${type} model ${docId}`);
  }

  // The summary view's fold produced this state, so the cast restates provenance.
  const model = summary as EventDocSummaryView;

  yield* askValidateModelOrThrowError(model, eventDocSummaryViewSchema);

  return { ...model, type };
}
