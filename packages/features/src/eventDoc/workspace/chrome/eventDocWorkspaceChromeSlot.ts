import { createEventDocDefinition } from '../../definition/createEventDocDefinition';
import { EventDocWorkspaceLocalSlotConfig } from '../types/EventDocWorkspaceLocalSlotConfig';
import { EventDocWorkspaceChromeState } from './types/EventDocWorkspaceChromeState';
import { eventDocWorkspaceChromeApi } from './eventDocWorkspaceChromeApi';
import { eventDocWorkspaceChromeSlotFold } from './eventDocWorkspaceChromeSlotFold';

/** The default chrome slot's config type. */
export type EventDocWorkspaceChromeSlot = EventDocWorkspaceLocalSlotConfig<EventDocWorkspaceChromeState, typeof eventDocWorkspaceChromeApi>;

/** The chrome slot every workspace gets by default; define your own `chrome` slot to replace it. */
export const eventDocWorkspaceChromeSlot: EventDocWorkspaceChromeSlot = createEventDocDefinition({
  saved: false,
  foldReducer: eventDocWorkspaceChromeSlotFold.foldReducer,
  createInitialViewState: eventDocWorkspaceChromeSlotFold.createInitialViewState,
  api: eventDocWorkspaceChromeApi,
});
