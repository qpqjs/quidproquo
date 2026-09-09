import { AskResponse } from 'quidproquo-core';
import { Nullable, QpqIsoDateTime } from 'quidproquo-core';

import { askEventDocGetById } from '../data/askEventDocGetById';
import { EventDocVersion } from '../models';
import { publishedAsOf } from './selectors/publishedAsOf';

/** The version published at or before `clock`, or null. */
export function* askEventDocGetPublishedAsOf(id: string, clock: QpqIsoDateTime): AskResponse<Nullable<EventDocVersion>> {
  const model = yield* askEventDocGetById(id);
  if (!model) {
    return null;
  }

  return publishedAsOf(model, clock);
}
