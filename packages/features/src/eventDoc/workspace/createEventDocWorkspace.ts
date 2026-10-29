import { eventDocWorkspaceChromeSlot } from './chrome/eventDocWorkspaceChromeSlot';
import { bindEventDocWorkspaceApi } from './logic/bindEventDocWorkspaceApi';
import { createEventDocWorkspaceBuiltInApi } from './logic/createEventDocWorkspaceBuiltInApi';
import { createEventDocWorkspaceSnapshot } from './logic/createEventDocWorkspaceSnapshot';
import { foldSlotPendingTail } from './logic/foldSlotPendingTail';
import { getSlotHistoryView } from './logic/getSlotHistoryView';
import { getSlotPending } from './logic/getSlotPending';
import { getSlotValidator } from './logic/getSlotValidator';
import { createEventDocWorkspaceReducer } from './reducer/createEventDocWorkspaceReducer';
import { createEventDocWorkspaceSelectors } from './selectors/createEventDocWorkspaceSelectors';
import { EventDocWorkspaceDefinition } from './types/EventDocWorkspaceDefinition';
import { EventDocWorkspaceSlotBinding } from './types/EventDocWorkspaceSlotBinding';
import { EventDocWorkspaceSlotConfig } from './types/EventDocWorkspaceSlotConfig';
import { EventDocWorkspaceSlotKind } from './types/EventDocWorkspaceSlotKind';
import { EventDocWorkspaceSlotsConfig } from './types/EventDocWorkspaceSlotsConfig';
import { createInitialEventDocWorkspaceState, EventDocWorkspaceState } from './types/EventDocWorkspaceState';
import { EventDocWorkspace, EventDocWorkspaceResolvedSlots } from './EventDocWorkspace';

const getSlotBinding = (
  slotKey: string,
  slot: EventDocWorkspaceSlotConfig,
  getView: (state: EventDocWorkspaceState) => unknown,
): EventDocWorkspaceSlotBinding => ({
  slotKey,
  schemaVersion: slot.schemaVersion ?? 1,
  validate: getSlotValidator(slot),
  getView,
  // Unmemoized on purpose: the view selector's cache includes transients, so it cannot serve a transient-free fold.
  getValidationView: (state) => foldSlotPendingTail(slot, getSlotHistoryView(state, slotKey), getSlotPending(state, slotKey)),
});

const resolveWorkspaceSlots = <TSlots extends EventDocWorkspaceSlotsConfig>(slots: TSlots): EventDocWorkspaceResolvedSlots<TSlots> =>
  ('chrome' in slots ? slots : { chrome: eventDocWorkspaceChromeSlot, ...slots }) as EventDocWorkspaceResolvedSlots<TSlots>;

/**
 * Builds a runnable workspace from a definition: one `docs.<key>` node per slot (bound api plus read surface), the built-in
 * init/save/cancel/refresh verbs at the root api, the reducer and the aggregate selectors.
 */
export const createEventDocWorkspace = <TSlots extends EventDocWorkspaceSlotsConfig>(
  definition: EventDocWorkspaceDefinition<TSlots>,
): EventDocWorkspace<EventDocWorkspaceResolvedSlots<TSlots>> => {
  const slots = resolveWorkspaceSlots(definition.slots);

  const slotsConfig = slots as EventDocWorkspaceSlotsConfig;
  const slotEntries = Object.entries(slotsConfig);
  const documentSlotKeys = slotEntries.filter(([, slot]) => slot.kind === EventDocWorkspaceSlotKind.document).map(([slotKey]) => slotKey);
  const localSlotKeys = slotEntries.filter(([, slot]) => slot.kind === EventDocWorkspaceSlotKind.local).map(([slotKey]) => slotKey);
  const storeNames = Object.fromEntries(
    slotEntries.flatMap(([slotKey, slot]) => (slot.kind === EventDocWorkspaceSlotKind.document && slot.storeName ? [[slotKey, slot.storeName]] : [])),
  );
  const slotSnapshotCacheKeys = Object.fromEntries(
    slotEntries.flatMap(([slotKey, slot]) =>
      slot.kind === EventDocWorkspaceSlotKind.document ? [[slotKey, slot.getSnapshotCacheKey?.() ?? '']] : [],
    ),
  );

  // Built before the bindings: each binding closes over its slot's memoized view selector.
  const selectors = createEventDocWorkspaceSelectors(slots);
  const selectorMap = <T>(keyed: unknown) => keyed as Record<string, (state: EventDocWorkspaceState) => T>;

  const docs = Object.fromEntries(
    slotEntries.map(([slotKey, slot]) => {
      const view = selectorMap(selectors.view)[slotKey];
      if (!view) {
        throw new Error(`Slot [${slotKey}] has no view selector`);
      }

      return [
        slotKey,
        {
          api: bindEventDocWorkspaceApi(getSlotBinding(slotKey, slot, view), slot.api),
          view,
          liveEvents: selectorMap(selectors.liveEvents)[slotKey],
          slotState: selectorMap(selectors.slotState)[slotKey],
        },
      ];
    }),
  ) as EventDocWorkspace<EventDocWorkspaceResolvedSlots<TSlots>>['docs'];

  return {
    docs,
    api: createEventDocWorkspaceBuiltInApi(definition.transport, slotsConfig, documentSlotKeys, localSlotKeys, slotSnapshotCacheKeys),
    storeNames,
    reducer: createEventDocWorkspaceReducer(slotsConfig),
    createInitialState: () => createInitialEventDocWorkspaceState(slotsConfig),
    createSnapshot: (state: EventDocWorkspaceState) => createEventDocWorkspaceSnapshot(state, documentSlotKeys, localSlotKeys),
    selectors: {
      isDirty: selectors.isDirty,
      isLoading: selectors.isLoading,
      isSaving: selectors.isSaving,
      error: selectors.error,
    },
  };
};
