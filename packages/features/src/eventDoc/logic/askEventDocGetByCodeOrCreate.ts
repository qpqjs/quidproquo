import { AskResponse } from 'quidproquo-core';

import { EventDocEventActor, EventDocSummary } from '../models';
import { askEventDocCreate } from './askEventDocCreate';
import { askEventDocGetByCode } from './askEventDocGetByCode';

/**
 * The doc with `code` (optionally owner-scoped), created on first use. Not concurrency-safe: two simultaneous
 * misses both create, so serialise callers that can race. Assumes the store context.
 */
export function* askEventDocGetByCodeOrCreate(
  code: string,
  name: string,
  actor: EventDocEventActor,
  ownerUserId?: string,
): AskResponse<EventDocSummary> {
  const existing = yield* askEventDocGetByCode(code, ownerUserId);
  if (existing) {
    return existing;
  }

  return yield* askEventDocCreate(name, code, actor);
}
