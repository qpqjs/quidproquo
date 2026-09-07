import { AskResponse } from 'quidproquo-core';

import { askEventDocGetByIdOrThrow, askEventDocReferences } from '../../eventDoc/logic';
import { EventDocLink } from '../../eventDoc/models';
import { EventDocDocRef, EventDocManifestItem, EventDocTransferRegistry } from '../models';
import { askEventDocTransferProvideCollection } from './askEventDocTransferProvideCollection';

const manifestKey = (ref: EventDocDocRef): string => `${ref.service}:${ref.type}:${ref.id}`;

const toDocRef = (link: EventDocLink): EventDocDocRef => ({
  service: link.eventDocService,
  type: link.eventDocType,
  id: link.id,
});

type VisitResult = {
  code: string;
  name: string;
  deleted: boolean;
  links: EventDocLink[];
};

// A soft-deleted doc is reported but not walked into: it will not be bundled, so its dependencies are moot.
function* askEventDocManifestVisit(docId: string): AskResponse<VisitResult> {
  const summary = yield* askEventDocGetByIdOrThrow(docId);

  if (summary.deletedAt) {
    return { code: summary.code, name: summary.name, deleted: true, links: [] };
  }

  const links = yield* askEventDocReferences(docId);

  return { code: summary.code, name: summary.name, deleted: false, links };
}

/**
 * Every doc that has to travel with `starts`, found by walking references breadth-first with a shared visited set
 * (so a doc shared by several roots appears once and cycles terminate). Returned in discovery order; reversed, that is leaves first.
 */
export function* askEventDocManifest(registry: EventDocTransferRegistry, starts: EventDocDocRef[]): AskResponse<EventDocManifestItem[]> {
  const queue: { ref: EventDocDocRef; depth: number }[] = starts.map((ref) => ({ ref, depth: 0 }));
  const visited = new Set<string>();
  const items: EventDocManifestItem[] = [];

  // The queue grows while it is walked.
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const { ref, depth } = queue[cursor];
    const key = manifestKey(ref);

    if (visited.has(key)) {
      continue;
    }

    visited.add(key);

    const { code, name, deleted, links } = yield* askEventDocTransferProvideCollection(registry, ref, askEventDocManifestVisit(ref.id));

    items.push({ ...ref, code, name, depth, deleted });

    for (const link of links) {
      queue.push({ ref: toDocRef(link), depth: depth + 1 });
    }
  }

  return items;
}
