import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { askEventDocStoreProvide, buildEventDocStore } from '../../eventDoc/context';
import { EventDocDocRef, EventDocTransferRegistry } from '../models';
import { findEventDocTransferCollection } from './findEventDocTransferCollection';

/** Runs `story` with the referenced collection's store provided. An unregistered or cross-service reference throws. */
export function* askEventDocTransferProvideCollection<T>(
  registry: EventDocTransferRegistry,
  ref: EventDocDocRef,
  story: AskResponse<T>,
): AskResponse<T> {
  const collection = findEventDocTransferCollection(registry, ref);

  if (!collection) {
    return yield* askThrowError(
      ErrorTypeEnum.BadRequest,
      `No registered event doc collection for ${ref.service}/${ref.type}. Transfers only span collections registered with defineEventDocTransfer in service '${registry.service}'.`,
    );
  }

  return yield* askEventDocStoreProvide(buildEventDocStore(collection), story);
}
