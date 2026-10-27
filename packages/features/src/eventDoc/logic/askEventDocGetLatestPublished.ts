import { AskResponse } from 'quidproquo-core';
import { Nullable } from 'quidproquo-core';

import { askEventDocGetById } from '../data/askEventDocGetById';
import { EventDocVersion } from '../models';
import { latestPublished } from './selectors/latestPublished';

/** Resolve the latest published version pointer for `id`, or null. */
export function* askEventDocGetLatestPublished(id: string): AskResponse<Nullable<EventDocVersion>> {
  const model = yield* askEventDocGetById(id);
  if (!model) {
    return null;
  }

  return latestPublished(model);
}
