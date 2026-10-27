import { AskResponse } from 'quidproquo-core';
import { Nullable } from 'quidproquo-core';

import { askEventDocGetByCode } from './askEventDocGetByCode';

/** The id of the doc whose `code` matches (optionally owner-scoped), or null. Assumes the store context. */
export function* askEventDocGetIdByCode(code: string, ownerUserId?: string): AskResponse<Nullable<string>> {
  const summary = yield* askEventDocGetByCode(code, ownerUserId);

  return summary?.id ?? null;
}
