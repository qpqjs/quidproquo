import { AskResponse } from 'quidproquo-core';
import { Nullable } from 'quidproquo-core';

import { askEventDocGetById } from '../data/askEventDocGetById';
import { EventDocVersion } from '../models';
import { draftVersion } from './selectors/draftVersion';

/** Resolve the current draft version pointer for `id`, or null. */
export function* askEventDocGetDraft(id: string): AskResponse<Nullable<EventDocVersion>> {
  const model = yield* askEventDocGetById(id);
  if (!model) {
    return null;
  }

  return draftVersion(model);
}
