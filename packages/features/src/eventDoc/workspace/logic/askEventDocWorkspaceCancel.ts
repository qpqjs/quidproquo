import { AskResponse } from '@qpqjs/core';

import { askEventDocWorkspaceClearError } from '../actionCreators/askEventDocWorkspaceClearError';
import { askEventDocWorkspaceSetPendingEvents } from '../actionCreators/askEventDocWorkspaceSetPendingEvents';

/** Discards the pending buffer of each slot; the saved log is untouched, so the view reverts reactively. */
export function* askEventDocWorkspaceCancel(slotKeys: string[]): AskResponse<void> {
  for (const slotKey of slotKeys) {
    yield* askEventDocWorkspaceSetPendingEvents(slotKey, []);
    yield* askEventDocWorkspaceClearError(slotKey);
  }
}
