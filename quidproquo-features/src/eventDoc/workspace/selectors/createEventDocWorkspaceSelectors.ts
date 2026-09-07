import { eventDocWorkspaceChromeSlotFold } from '../chrome/eventDocWorkspaceChromeSlotFold';
import { EventDocWorkspaceResolvedFoldSlots } from '../types/EventDocWorkspaceResolvedFoldSlots';
import { EventDocWorkspaceSelectors } from '../types/EventDocWorkspaceSelectors';
import { EventDocWorkspaceSlotFoldConfig } from '../types/EventDocWorkspaceSlotFoldConfig';
import { EventDocWorkspaceSlotFoldsConfig } from '../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceSlotKind } from '../types/EventDocWorkspaceSlotKind';
import { createEventDocWorkspaceIsDirtySelector } from './createEventDocWorkspaceIsDirtySelector';
import { createEventDocWorkspaceIsSavingSelector } from './createEventDocWorkspaceIsSavingSelector';
import { createSlotLiveEventsSelector } from './createSlotLiveEventsSelector';
import { createSlotStateSelector } from './createSlotStateSelector';
import { createSlotViewSelector } from './createSlotViewSelector';
import { selectEventDocWorkspaceError } from './selectEventDocWorkspaceError';
import { selectEventDocWorkspaceIsLoading } from './selectEventDocWorkspaceIsLoading';

const mapSlots = <T>(
  slots: EventDocWorkspaceSlotFoldsConfig,
  createSelector: (slotKey: string, slot: EventDocWorkspaceSlotFoldConfig) => T,
): Record<string, T> => Object.fromEntries(Object.entries(slots).map(([slotKey, slot]) => [slotKey, createSelector(slotKey, slot)]));

/**
 * Builds the per-slot selectors and workspace aggregates from api-free fold configs, resolving the default chrome fold slot
 * itself (idempotent), so selectors can live in a module that imports no api.
 */
export const createEventDocWorkspaceSelectors = <TSlots extends EventDocWorkspaceSlotFoldsConfig>(
  slots: TSlots,
): EventDocWorkspaceSelectors<EventDocWorkspaceResolvedFoldSlots<TSlots>> => {
  const resolvedSlots: EventDocWorkspaceSlotFoldsConfig = 'chrome' in slots ? slots : { chrome: eventDocWorkspaceChromeSlotFold, ...slots };

  const documentSlotKeys = Object.entries(resolvedSlots)
    .filter(([, slot]) => slot.kind === EventDocWorkspaceSlotKind.document)
    .map(([slotKey]) => slotKey);

  return {
    liveEvents: mapSlots(resolvedSlots, createSlotLiveEventsSelector),
    view: mapSlots(resolvedSlots, createSlotViewSelector),
    slotState: mapSlots(resolvedSlots, createSlotStateSelector),
    isDirty: createEventDocWorkspaceIsDirtySelector(documentSlotKeys),
    isLoading: selectEventDocWorkspaceIsLoading,
    isSaving: createEventDocWorkspaceIsSavingSelector(documentSlotKeys),
    error: selectEventDocWorkspaceError,
  } as EventDocWorkspaceSelectors<EventDocWorkspaceResolvedFoldSlots<TSlots>>;
};
