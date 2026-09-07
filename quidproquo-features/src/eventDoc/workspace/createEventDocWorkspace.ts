import { defaultEventDocEventValidator } from '../validation';
import { eventDocWorkspaceChromeSlot } from './chrome/eventDocWorkspaceChromeSlot';
import { bindEventDocWorkspaceApi } from './logic/bindEventDocWorkspaceApi';
import { createEventDocWorkspaceBuiltInApi } from './logic/createEventDocWorkspaceBuiltInApi';
import { createEventDocWorkspaceSnapshot } from './logic/createEventDocWorkspaceSnapshot';
import { foldSlotPendingTail } from './logic/foldSlotPendingTail';
import { getSlotHistoryView } from './logic/getSlotHistoryView';
import { getSlotPending } from './logic/getSlotPending';
import { createEventDocWorkspaceReducer } from './reducer/createEventDocWorkspaceReducer';
import { createEventDocWorkspaceSelectors } from './selectors/createEventDocWorkspaceSelectors';
import { EventDocWorkspaceDefinition } from './types/EventDocWorkspaceDefinition';
import { EventDocWorkspaceSlotBinding } from './types/EventDocWorkspaceSlotBinding';
import { EventDocWorkspaceSlotConfig } from './types/EventDocWorkspaceSlotConfig';
import { EventDocWorkspaceSlotKind } from './types/EventDocWorkspaceSlotKind';
import { EventDocWorkspaceSlotsConfig } from './types/EventDocWorkspaceSlotsConfig';
import { createInitialEventDocWorkspaceState, EventDocWorkspaceState } from './types/EventDocWorkspaceState';
import { EventDocWorkspace, EventDocWorkspaceResolvedSlots } from './EventDocWorkspace';

// A document slot without a validator falls back to the lifecycle guard so a published document cannot be silently mutated.
const getSlotBinding = (
  slotKey: string,
  slot: EventDocWorkspaceSlotConfig,
  getView: (state: EventDocWorkspaceState) => unknown,
): EventDocWorkspaceSlotBinding => ({
  slotKey,
  schemaVersion: slot.schemaVersion ?? 1,
  validate: slot.kind === EventDocWorkspaceSlotKind.document ? (slot.validate ?? defaultEventDocEventValidator) : (slot.validate ?? null),
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

  // Built before the bindings: each binding closes over its slot's memoized view selector.
  const selectors = createEventDocWorkspaceSelectors(slots);
  const selectorMap = <T>(keyed: unknown) => keyed as Record<string, (state: EventDocWorkspaceState) => T>;

  const docs = Object.fromEntries(
    slotEntries.map(([slotKey, slot]) => [
      slotKey,
      {
        api: bindEventDocWorkspaceApi(getSlotBinding(slotKey, slot, selectorMap(selectors.view)[slotKey]), slot.api),
        view: selectorMap(selectors.view)[slotKey],
        liveEvents: selectorMap(selectors.liveEvents)[slotKey],
        slotState: selectorMap(selectors.slotState)[slotKey],
      },
    ]),
  ) as EventDocWorkspace<EventDocWorkspaceResolvedSlots<TSlots>>['docs'];

  return {
    docs,
    api: createEventDocWorkspaceBuiltInApi(definition.transport, documentSlotKeys, localSlotKeys),
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
