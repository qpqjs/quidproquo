import { reservedEventDocWorkspaceCoalesceEventTypes } from '../constants/reservedEventDocWorkspaceCoalesceEventTypes';
import { EventDocWorkspaceCoalesceRules } from '../types/EventDocWorkspaceCoalesceRules';
import { EventDocWorkspaceSlotFoldConfig } from '../types/EventDocWorkspaceSlotFoldConfig';
import { EventDocWorkspaceSlotKind } from '../types/EventDocWorkspaceSlotKind';

/** Coalesce rules for one slot: document slots get the reserved field-setter rules ahead of their own; local slots default to 'all'. */
export const getSlotCoalesceRules = (slot: EventDocWorkspaceSlotFoldConfig): EventDocWorkspaceCoalesceRules =>
  slot.kind === EventDocWorkspaceSlotKind.document
    ? [...reservedEventDocWorkspaceCoalesceEventTypes, ...(slot.coalesceEventTypes ?? [])]
    : (slot.coalesceEventTypes ?? 'all');
