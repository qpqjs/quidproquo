import { AskResponse } from 'quidproquo-core';

import { askEventDocEventListAll, askEventDocGetById } from '../../eventDoc/data';
import { askEventDocGetIdByCode } from '../../eventDoc/logic';
import { foldEventDocSummary } from '../../eventDoc/summary';
import { EventDocBundleDoc, EventDocTransferPlanRow, EventDocTransferStatus } from '../models';
import { findEventDocLogDivergence } from './findEventDocLogDivergence';

const toPlanRow = (
  doc: EventDocBundleDoc,
  code: string,
  name: string,
  existingEvents: number,
  status: EventDocTransferStatus,
  detail?: string,
): EventDocTransferPlanRow => ({
  service: doc.service,
  type: doc.type,
  id: doc.id,
  code,
  name,
  status,
  incomingEvents: doc.events.length,
  existingEvents,
  eventsWritten: 0,
  assetsWritten: 0,
  discardedEvents: 0,
  detail,
});

/** What an import of one doc would do. Writes nothing; identity comes from folding the incoming log. Requires the store context. */
export function* askEventDocBundlePlanDoc(doc: EventDocBundleDoc): AskResponse<EventDocTransferPlanRow> {
  const { code, name } = foldEventDocSummary(doc.events);

  // An export never emits an empty log; this only fires for a hand-edited bundle.
  if (doc.events.length === 0) {
    return toPlanRow(doc, code, name, 0, EventDocTransferStatus.Ignored, 'The bundle carries no events for this doc.');
  }

  // Checked for every doc, not just new ones: a fast-forward can carry a SetCode onto a code a sibling already holds,
  // and askEventDocGetByCode throws on more than one match.
  const codeOwnerId = yield* askEventDocGetIdByCode(code);

  if (codeOwnerId && codeOwnerId !== doc.id) {
    return toPlanRow(doc, code, name, 0, EventDocTransferStatus.CodeConflict, `Code '${code}' is already used by doc ${codeOwnerId}.`);
  }

  const existing = yield* askEventDocGetById(doc.id);

  if (!existing) {
    return toPlanRow(doc, code, name, 0, EventDocTransferStatus.New);
  }

  const existingEvents = yield* askEventDocEventListAll(doc.id);
  const comparison = findEventDocLogDivergence(existingEvents, doc.events);

  if (comparison.diverged) {
    return toPlanRow(
      doc,
      code,
      name,
      existingEvents.length,
      EventDocTransferStatus.Diverged,
      `Logs disagree at event ${comparison.atIndex}: the target was edited directly.`,
    );
  }

  if (comparison.existingAhead) {
    return toPlanRow(
      doc,
      code,
      name,
      existingEvents.length,
      EventDocTransferStatus.Diverged,
      `The target is ahead by ${existingEvents.length - doc.events.length} event(s): the bundle is older than what is already here.`,
    );
  }

  if (comparison.sharedCount === doc.events.length) {
    return toPlanRow(doc, code, name, existingEvents.length, EventDocTransferStatus.Same);
  }

  return toPlanRow(doc, code, name, existingEvents.length, EventDocTransferStatus.FastForward);
}
