import { EventDocWorkspaceChromeSetHelpOpenEffect } from './EventDocWorkspaceChromeSetHelpOpenEffect';
import { EventDocWorkspaceChromeSetHistoryOpenEffect } from './EventDocWorkspaceChromeSetHistoryOpenEffect';
import { EventDocWorkspaceChromeSetHistorySlotKeyEffect } from './EventDocWorkspaceChromeSetHistorySlotKeyEffect';

/** Union of the chrome slot effects. */
export type EventDocWorkspaceChromeEffects =
  EventDocWorkspaceChromeSetHistoryOpenEffect | EventDocWorkspaceChromeSetHelpOpenEffect | EventDocWorkspaceChromeSetHistorySlotKeyEffect;
