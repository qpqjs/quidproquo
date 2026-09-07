import { AskResponse } from 'quidproquo-core';

import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceSaveSlot } from './askEventDocWorkspaceSaveSlot';

/** Saves the requested slots one after another so cross-slot ordering stays deterministic. */
export function* askEventDocWorkspaceSave(transport: EventDocWorkspaceTransport, slotKeys: string[]): AskResponse<void> {
  for (const slotKey of slotKeys) {
    yield* askEventDocWorkspaceSaveSlot(transport, slotKey);
  }
}
