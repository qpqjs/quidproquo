import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { EventDocStore } from '../types/EventDocStore';
import { askEventDocStoreRead } from './askEventDocStoreRead';

/** Reads the store context, throwing if it was not provided (a plain context read returns the empty default). */
export function* askEventDocResolveStore(): AskResponse<EventDocStore> {
  const store = yield* askEventDocStoreRead();

  if (!store.storeName || !store.type) {
    return yield* askThrowError(
      ErrorTypeEnum.GenericError,
      'EventDoc store context was not provided. Wrap the call in askEventDocStoreProvide({ storeName, type }, ...).',
    );
  }

  return store;
}
