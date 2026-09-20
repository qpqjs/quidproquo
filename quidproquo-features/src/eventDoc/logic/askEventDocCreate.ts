import { AskResponse } from 'quidproquo-core';

import { askValidateModelOrThrowError } from '../../validation/askValidateModelOrThrowError';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { askEventDocUpsert } from '../data/askEventDocUpsert';
import { EventDocEventActor, EventDocSummary, eventDocSummaryViewSchema } from '../models';
import { applyEventDocSummaryEvent, createEventDocSummarySeed } from '../summary';
import { askEventDocGenerateNewId } from './askEventDocGenerateNewId';
import { askEventDocSeedInitState } from './askEventDocSeedInitState';

/**
 * Create a model: seed the INIT_STATE event that opens its log, then derive the summary record from it
 * through the same reducer every later append uses. Pass `id` when the caller must know it before the
 * write, e.g. to provide a storage scope derived from it.
 */
export function* askEventDocCreate(name: string, code: string, actor: EventDocEventActor, id?: string): AskResponse<EventDocSummary> {
  const { type } = yield* askEventDocResolveStore();
  const docId = id ?? (yield* askEventDocGenerateNewId());

  const initEvent = yield* askEventDocSeedInitState(docId, code, name, actor);

  const model = applyEventDocSummaryEvent(createEventDocSummarySeed(), initEvent);

  yield* askValidateModelOrThrowError(model, eventDocSummaryViewSchema);
  yield* askEventDocUpsert(model);

  return { ...model, type };
}
