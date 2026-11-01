import { AskResponse } from '@qpqjs/core';

import { askEventDocEventListAll } from '../../eventDoc/data';
import { EventDocEvent } from '../../eventDoc/models';
import { EventDocPermissionAction } from '../../eventDoc/types/EventDocPermissionAction';
import { askEventDocTransferAuthorise } from '../globals/askEventDocTransferAuthorise';
import { EventDocBundleApplyOptions, EventDocBundleDoc, EventDocTransferPlanRow, EventDocTransferStatus } from '../models';
import { askEventDocBundlePlanDoc } from './askEventDocBundlePlanDoc';
import { askEventDocTransferTruncateLog } from './askEventDocTransferTruncateLog';
import { askEventDocTransferWriteAssets } from './askEventDocTransferWriteAssets';
import { askEventDocValidateForeignTail } from './askEventDocValidateForeignTail';
import { askEventDocWriteForeignEvents } from './askEventDocWriteForeignEvents';
import { findEventDocLogDivergence } from './findEventDocLogDivergence';
import { toEventDocLocalActor } from './toEventDocLocalActor';

const isWritable = (status: EventDocTransferStatus): boolean =>
  status === EventDocTransferStatus.New || status === EventDocTransferStatus.FastForward;

// Force never applies to a code conflict: discarding this doc's tail cannot free a code another doc holds.
const isForceable = (status: EventDocTransferStatus): boolean => status === EventDocTransferStatus.Diverged;

// A divergence cuts at the first disagreement; a target that is merely ahead cuts at the end of the bundle's log.
const overwriteFromIndex = (existingEvents: EventDocEvent[], incoming: EventDocEvent[]): number => {
  const comparison = findEventDocLogDivergence(existingEvents, incoming);

  return comparison.diverged ? comparison.atIndex : comparison.sharedCount;
};

/**
 * Imports one doc. Re-plans first so the decision is made against the target as it is now, not the plan the operator
 * reviewed earlier. With `force`, a diverged doc's tail is backed up and deleted before the fast-forward. Requires the store context.
 */
export function* askEventDocBundleApplyDoc(doc: EventDocBundleDoc, options: EventDocBundleApplyOptions): AskResponse<EventDocTransferPlanRow> {
  const row = yield* askEventDocBundlePlanDoc(doc);

  if (isWritable(row.status)) {
    yield* askEventDocTransferAuthorise(row.status === EventDocTransferStatus.New ? EventDocPermissionAction.create : EventDocPermissionAction.write);

    const eventsWritten = yield* askEventDocWriteForeignEvents(doc.id, doc.events, row.existingEvents, {
      importerUserId: options.importerUserId,
    });
    const assetsWritten = yield* askEventDocTransferWriteAssets(doc.id, doc.assets);

    return { ...row, eventsWritten, assetsWritten };
  }

  if (!options.force || !isForceable(row.status)) {
    return row;
  }

  // Discarding the tail is a delete, and the fast-forward after it a write.
  yield* askEventDocTransferAuthorise(EventDocPermissionAction.delete);
  yield* askEventDocTransferAuthorise(EventDocPermissionAction.write);

  const existingEvents = yield* askEventDocEventListAll(doc.id);
  const fromIndex = overwriteFromIndex(existingEvents, doc.events);

  // The tail is checked before the cut, against the prefix already in hand: a bundle that fails the gate must leave
  // the target's log whole, not cut short with its summary pointing at deleted events.
  const localised = doc.events.map((event) => toEventDocLocalActor(event, options.importerUserId));
  yield* askEventDocValidateForeignTail(doc.id, localised, fromIndex, existingEvents.slice(0, fromIndex));

  const discarded = yield* askEventDocTransferTruncateLog(options.transferId, doc.id, existingEvents, fromIndex);
  const eventsWritten = yield* askEventDocWriteForeignEvents(doc.id, doc.events, fromIndex, {
    importerUserId: options.importerUserId,
    logRewritten: discarded.length > 0,
  });
  const assetsWritten = yield* askEventDocTransferWriteAssets(doc.id, doc.assets);

  return {
    ...row,
    status: EventDocTransferStatus.Overwritten,
    existingEvents: existingEvents.length,
    eventsWritten,
    assetsWritten,
    discardedEvents: discarded.length,
  };
}
