import { AskResponse } from 'quidproquo-core';

import { askEventDocEventLast } from '../data/askEventDocEventLast';
import { askEventDocEventList } from '../data/askEventDocEventList';
import { askEventDocSnapshotBaseLatest } from '../data/askEventDocSnapshotBaseLatest';
import { EventDocEventBootstrapPage } from '../models';

/** Paging options for the bootstrap read. */
export type EventDocEventBootstrapPageOptions = {
  limit?: number;
  nextPageKey?: string;
};

/**
 * The reader's bootstrap read: the newest usable fold base plus the first page of events after it.
 * No usable base means `base: null` and the page starts at the log's beginning.
 */
export function* askEventDocEventBootstrapPage(
  modelId: string,
  options?: EventDocEventBootstrapPageOptions,
): AskResponse<EventDocEventBootstrapPage> {
  // The base lookup is clamped to the head so a snapshot that outlived its events is never served with an empty tail.
  const head = yield* askEventDocEventLast(modelId);

  if (!head) {
    return { base: null, items: [] };
  }

  const base = yield* askEventDocSnapshotBaseLatest(modelId, head.payload.metadata.eventId);

  const page = yield* askEventDocEventList(modelId, {
    limit: options?.limit,
    nextPageKey: options?.nextPageKey,
    afterEventId: base?.eventId,
  });

  return { ...page, base };
}
