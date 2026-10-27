import { AskResponse } from 'quidproquo-core';

import { askUIEventDocWorkspaceClearError } from '../actionCreators/askUIEventDocWorkspaceClearError';
import { askUIEventDocWorkspaceSetPendingEvents } from '../actionCreators/askUIEventDocWorkspaceSetPendingEvents';

/** Discards the pending buffer of each slot; the saved log is untouched, so the view reverts reactively. */
export function* askEventDocWorkspaceCancel(slotKeys: string[]): AskResponse<void> {
  for (const slotKey of slotKeys) {
    yield* askUIEventDocWorkspaceSetPendingEvents(slotKey, []);
    yield* askUIEventDocWorkspaceClearError(slotKey);
  }
}
