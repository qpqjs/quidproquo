import { EventDocWorkspaceChromeSlotFold } from '../chrome/eventDocWorkspaceChromeSlotFold';
import { EventDocWorkspaceSlotFoldsConfig } from './EventDocWorkspaceSlotFoldsConfig';

/** Fold-level mirror of EventDocWorkspaceResolvedSlots: adds the default chrome fold slot unless one is defined. */
export type EventDocWorkspaceResolvedFoldSlots<TSlots extends EventDocWorkspaceSlotFoldsConfig> = 'chrome' extends keyof TSlots
  ? TSlots
  : TSlots & { chrome: EventDocWorkspaceChromeSlotFold };
