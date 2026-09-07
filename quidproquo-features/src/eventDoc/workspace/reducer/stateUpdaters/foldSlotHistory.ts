import { Nullable } from 'quidproquo-core';

import { EventDocEvent, EventDocSnapshotBase } from '../../../models';
import { EventDocWorkspaceSlotFoldConfig } from '../../types/EventDocWorkspaceSlotFoldConfig';
import { foldHistoryEventsIntoAccumulator } from './foldHistoryEventsIntoAccumulator';

/**
 * Folds a slot's saved log through the same per-event steps the incremental appends use, seeded from the base (or the
 * initial view state). Not foldEventDocLog: the stored view must stay at the last folded event's version.
 */
export const foldSlotHistory = (
  slot: EventDocWorkspaceSlotFoldConfig,
  history: EventDocEvent[],
  base: Nullable<EventDocSnapshotBase> = null,
): unknown => foldHistoryEventsIntoAccumulator(slot, base ? base.state : slot.createInitialViewState(), history);
