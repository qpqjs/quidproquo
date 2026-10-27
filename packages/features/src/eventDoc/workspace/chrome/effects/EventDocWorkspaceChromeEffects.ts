import { EventDocWorkspaceChromeSetHelpOpenEffect } from './EventDocWorkspaceChromeSetHelpOpenEffect';
import { EventDocWorkspaceChromeSetHistoryAssetUrlsEffect } from './EventDocWorkspaceChromeSetHistoryAssetUrlsEffect';
import { EventDocWorkspaceChromeSetHistoryOpenEffect } from './EventDocWorkspaceChromeSetHistoryOpenEffect';
import { EventDocWorkspaceChromeSetHistorySlotKeyEffect } from './EventDocWorkspaceChromeSetHistorySlotKeyEffect';

/** Union of the chrome slot effects. */
export type EventDocWorkspaceChromeEffects =
  | EventDocWorkspaceChromeSetHistoryOpenEffect
  | EventDocWorkspaceChromeSetHelpOpenEffect
  | EventDocWorkspaceChromeSetHistorySlotKeyEffect
  | EventDocWorkspaceChromeSetHistoryAssetUrlsEffect;
