import { AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { askEventDocGetById } from '../data/askEventDocGetById';
import { EventDocSummary } from '../models';

/** Load the head row for `id`, throwing NotFound if it does not exist. */
export function* askEventDocGetByIdOrThrow(id: string): AskResponse<EventDocSummary> {
  const model = yield* askEventDocGetById(id);

  if (!model) {
    const { type } = yield* askEventDocStoreReadOrThrow();
    return yield* askThrowError(ErrorTypeEnum.NotFound, `${type} model not found: ${id}`);
  }

  return model;
}
