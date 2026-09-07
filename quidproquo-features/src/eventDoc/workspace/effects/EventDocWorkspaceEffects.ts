import { EventDocWorkspaceAppendFullHistoryEffect } from './EventDocWorkspaceAppendFullHistoryEffect';
import { EventDocWorkspaceAppendHistoryEventEffect } from './EventDocWorkspaceAppendHistoryEventEffect';
import { EventDocWorkspaceAppendHistoryEventsEffect } from './EventDocWorkspaceAppendHistoryEventsEffect';
import { EventDocWorkspaceApplyEventEffect } from './EventDocWorkspaceApplyEventEffect';
import { EventDocWorkspaceApplyTransientEventEffect } from './EventDocWorkspaceApplyTransientEventEffect';
import { EventDocWorkspaceClearErrorEffect } from './EventDocWorkspaceClearErrorEffect';
import { EventDocWorkspaceDropTransientEffect } from './EventDocWorkspaceDropTransientEffect';
import { EventDocWorkspaceRemovePendingEventEffect } from './EventDocWorkspaceRemovePendingEventEffect';
import { EventDocWorkspaceResetEffect } from './EventDocWorkspaceResetEffect';
import { EventDocWorkspaceSetDocumentIdentityEffect } from './EventDocWorkspaceSetDocumentIdentityEffect';
import { EventDocWorkspaceSetErrorEffect } from './EventDocWorkspaceSetErrorEffect';
import { EventDocWorkspaceSetFullHistoryEffect } from './EventDocWorkspaceSetFullHistoryEffect';
import { EventDocWorkspaceSetHistoryEventsEffect } from './EventDocWorkspaceSetHistoryEventsEffect';
import { EventDocWorkspaceSetLoadingEffect } from './EventDocWorkspaceSetLoadingEffect';
import { EventDocWorkspaceSetPendingEventsEffect } from './EventDocWorkspaceSetPendingEventsEffect';
import { EventDocWorkspaceSetSavingEffect } from './EventDocWorkspaceSetSavingEffect';

/** Union of the workspace effects. */
export type EventDocWorkspaceEffects =
  | EventDocWorkspaceApplyEventEffect
  | EventDocWorkspaceApplyTransientEventEffect
  | EventDocWorkspaceDropTransientEffect
  | EventDocWorkspaceSetHistoryEventsEffect
  | EventDocWorkspaceSetFullHistoryEffect
  | EventDocWorkspaceAppendFullHistoryEffect
  | EventDocWorkspaceAppendHistoryEventEffect
  | EventDocWorkspaceAppendHistoryEventsEffect
  | EventDocWorkspaceSetPendingEventsEffect
  | EventDocWorkspaceRemovePendingEventEffect
  | EventDocWorkspaceSetDocumentIdentityEffect
  | EventDocWorkspaceSetLoadingEffect
  | EventDocWorkspaceSetSavingEffect
  | EventDocWorkspaceSetErrorEffect
  | EventDocWorkspaceClearErrorEffect
  | EventDocWorkspaceResetEffect;
