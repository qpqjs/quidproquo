import { buildEffectReducer, QpqReducer } from 'quidproquo-core';

import { EventDocFoldEffects } from '../../fold/EventDocFoldEffects';
import { EventDocEvent } from '../../models';
import { EventDocWorkspaceChromeEffect } from './effects/EventDocWorkspaceChromeEffect';
import { EventDocWorkspaceChromeEffects } from './effects/EventDocWorkspaceChromeEffects';
import { setHelpOpen } from './stateUpdaters/setHelpOpen';
import { setHistoryOpen } from './stateUpdaters/setHistoryOpen';
import { setHistorySlotKey } from './stateUpdaters/setHistorySlotKey';
import { EventDocWorkspaceChromeState } from './types/EventDocWorkspaceChromeState';

/** Chrome slot fold reducer. Cast to the generic EventDocEvent reducer at the registration boundary, as document folds are. */
export const eventDocWorkspaceChromeFoldReducer = buildEffectReducer<
  EventDocWorkspaceChromeState,
  EventDocFoldEffects<EventDocWorkspaceChromeEffects>
>({
  [EventDocWorkspaceChromeEffect.SetHistoryOpen]: setHistoryOpen,
  [EventDocWorkspaceChromeEffect.SetHelpOpen]: setHelpOpen,
  [EventDocWorkspaceChromeEffect.SetHistorySlotKey]: setHistorySlotKey,
}) as QpqReducer<EventDocWorkspaceChromeState, EventDocEvent>;
