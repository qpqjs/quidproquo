import { askNewGuid, AskResponse } from 'quidproquo-core';

/** The id for a new document. The one place the id format is decided; anything that needs an id before create mints it here. */
export function* askEventDocGenerateNewId(): AskResponse<string> {
  return yield* askNewGuid();
}
