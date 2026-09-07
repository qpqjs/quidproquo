import { replayEffects } from 'quidproquo-core';

import { foldEventDocLogStep } from '../../../fold/foldEventDocLogStep';
import { EventDocDocument, EventDocEvent } from '../../../models';
import { reservedEventDocEventValidators } from '../../../validation/reservedEventDocEventValidators';
import { EventDocWorkspaceSlotFoldConfig } from '../../types/EventDocWorkspaceSlotFoldConfig';
import { EventDocWorkspaceSlotKind } from '../../types/EventDocWorkspaceSlotKind';

/**
 * Folds history events onto the stored accumulator (initial fold and appended tails alike). Document slots step through
 * foldEventDocLogStep per event with the slot's validators, so the live view rejects exactly what the saved fold rejects.
 */
// No migrate-to-latest here: the accumulator stays at the last folded event's version, otherwise a valid same-version refresh
// tail would trip the version guard. Migration happens at read. Only state-based validators work here: an incremental tail fold
// has no whole-log memory for dedup or the version floor.
export const foldHistoryEventsIntoAccumulator = (slot: EventDocWorkspaceSlotFoldConfig, accumulator: unknown, events: EventDocEvent[]): unknown => {
  if (slot.kind !== EventDocWorkspaceSlotKind.document) {
    return replayEffects(accumulator, slot.foldReducer, events);
  }

  const migrations = slot.migrations ?? {};
  const latestVersion = slot.schemaVersion ?? 1;

  // A hand-assembled slot falls back to the reserved validators so it still gets the lifecycle guard.
  const validators = slot.validators ?? reservedEventDocEventValidators;

  let next = accumulator as EventDocDocument;

  for (const event of events) {
    [next] = foldEventDocLogStep(next, event, { reducer: slot.foldReducer, migrations, latestVersion, validators });
  }

  return next;
};
