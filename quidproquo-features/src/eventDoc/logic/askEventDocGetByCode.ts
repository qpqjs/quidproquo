import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { Nullable } from 'quidproquo-core';

import { askEventDocList } from '../data/askEventDocList';
import { EventDocSummary } from '../models';

/**
 * The single non-deleted doc whose `code` matches, optionally scoped to an owner (`createdBy`). Null on no match;
 * throws Conflict on more than one. Lists the collection and filters in memory (no index on `code`). Assumes the store context.
 */
export function* askEventDocGetByCode<T extends EventDocSummary = EventDocSummary>(code: string, ownerUserId?: string): AskResponse<Nullable<T>> {
  const summaries = yield* askEventDocList<T>();

  const matches = summaries.filter((summary) => summary.code === code && (ownerUserId === undefined || summary.createdBy === ownerUserId));

  if (matches.length === 0) {
    return null;
  }

  if (matches.length > 1) {
    return yield* askThrowError(ErrorTypeEnum.Conflict, `Multiple instances detected for code "${code}"`);
  }

  return matches[0];
}
