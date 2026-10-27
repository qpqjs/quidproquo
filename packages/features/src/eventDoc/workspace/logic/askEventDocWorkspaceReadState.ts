import { AskResponse, askStateRead } from 'quidproquo-core';

import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';

/** Reads the whole workspace state; the workspace is always the root runtime state wherever it runs. */
export function* askEventDocWorkspaceReadState(): AskResponse<EventDocWorkspaceState> {
  return yield* askStateRead<EventDocWorkspaceState>();
}
