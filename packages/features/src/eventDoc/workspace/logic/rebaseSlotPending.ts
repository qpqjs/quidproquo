import { replayEffects } from '@qpqjs/core';

import { foldEventDocLogStep } from '../../fold/foldEventDocLogStep';
import { migrateEventDocDocumentTo } from '../../fold/migrateEventDocDocumentTo';
import { EventDocDocument, EventDocEvent } from '../../models';
import { EventDocWorkspaceRebaseResult } from '../types/EventDocWorkspaceRebaseResult';
import { EventDocWorkspaceSlotFoldConfig } from '../types/EventDocWorkspaceSlotFoldConfig';
import { EventDocWorkspaceSlotKind } from '../types/EventDocWorkspaceSlotKind';
import { getSlotValidator } from './getSlotValidator';

// Document slots validate against the latest-shaped document, as a commit does; the accumulator itself stays at the last
// folded event's version so an old-version restored tail keeps folding.
const toValidationView = (slot: EventDocWorkspaceSlotFoldConfig, accumulator: unknown): unknown =>
  slot.kind === EventDocWorkspaceSlotKind.document
    ? migrateEventDocDocumentTo(accumulator as EventDocDocument, slot.schemaVersion ?? 1, slot.migrations ?? {})
    : accumulator;

const foldOne = (slot: EventDocWorkspaceSlotFoldConfig, accumulator: unknown, event: EventDocEvent): unknown => {
  if (slot.kind !== EventDocWorkspaceSlotKind.document) {
    return replayEffects(accumulator, slot.foldReducer, [event]);
  }

  const [next] = foldEventDocLogStep(accumulator as EventDocDocument, event, {
    reducer: slot.foldReducer,
    migrations: slot.migrations ?? {},
    latestVersion: slot.schemaVersion ?? 1,
  });

  return next;
};

/**
 * Re-judges a pending buffer against a new stored view, in order, with the slot's validator: each event is checked
 * against the view plus the events kept before it, exactly as its original commit was. A rejected event is left out of
 * that running state, so the ones after it are judged without it. A slot with no validator keeps everything.
 */
export const rebaseSlotPending = (
  slot: EventDocWorkspaceSlotFoldConfig,
  historyView: unknown,
  pending: EventDocEvent[],
): EventDocWorkspaceRebaseResult => {
  const validate = getSlotValidator(slot);

  if (!validate || pending.length === 0) {
    return { kept: pending, dropped: [] };
  }

  const kept: EventDocEvent[] = [];
  const dropped: EventDocWorkspaceRebaseResult['dropped'] = [];
  let accumulator = historyView;

  for (const event of pending) {
    const reason = validate(event, toValidationView(slot, accumulator));

    if (reason) {
      dropped.push({ event, reason });
      continue;
    }

    kept.push(event);
    accumulator = foldOne(slot, accumulator, event);
  }

  return { kept, dropped };
};
