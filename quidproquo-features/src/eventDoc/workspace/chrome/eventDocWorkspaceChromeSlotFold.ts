import { EventDocWorkspaceLocalSlotFoldConfig } from '../types/EventDocWorkspaceLocalSlotFoldConfig';
import { EventDocWorkspaceSlotKind } from '../types/EventDocWorkspaceSlotKind';
import { createInitialEventDocWorkspaceChromeState, EventDocWorkspaceChromeState } from './types/EventDocWorkspaceChromeState';
import { eventDocWorkspaceChromeFoldReducer } from './eventDocWorkspaceChromeFoldReducer';

/** The chrome slot's fold config type. */
export type EventDocWorkspaceChromeSlotFold = EventDocWorkspaceLocalSlotFoldConfig<EventDocWorkspaceChromeState>;

/** The chrome slot's api-free fold config, used when selectors are built without a `chrome` slot defined. */
export const eventDocWorkspaceChromeSlotFold: EventDocWorkspaceChromeSlotFold = {
  kind: EventDocWorkspaceSlotKind.local,
  foldReducer: eventDocWorkspaceChromeFoldReducer,
  createInitialViewState: createInitialEventDocWorkspaceChromeState,
};
