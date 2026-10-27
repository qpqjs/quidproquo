import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { askEventDocGetById } from '../data/askEventDocGetById';
import { EventDocSummary } from '../models';

/** Load the head row for `id`, throwing NotFound if it does not exist. */
export function* askEventDocGetByIdOrThrow(id: string): AskResponse<EventDocSummary> {
  const model = yield* askEventDocGetById(id);

  if (!model) {
    const { type } = yield* askEventDocResolveStore();
    return yield* askThrowError(ErrorTypeEnum.NotFound, `${type} model not found: ${id}`);
  }

  return model;
}
