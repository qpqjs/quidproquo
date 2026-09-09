import { AskResponse } from 'quidproquo-core';

import { EventDocWorkspaceDocumentIdentity } from './EventDocWorkspaceDocumentIdentity';
import { EventDocWorkspaceSnapshot } from './EventDocWorkspaceSnapshot';

/**
 * The workspace's built-in verbs. slotKey omitted means every document slot. askInit's snapshot restores a prior runtime's
 * state per identity-matched slot; askLoadHistory/askLoadOlderHistory page the display history newest first.
 */
export type EventDocWorkspaceBuiltInApi = {
  askInit: (identities: Record<string, EventDocWorkspaceDocumentIdentity>, snapshot?: EventDocWorkspaceSnapshot) => AskResponse<void>;
  askSave: (slotKey?: string) => AskResponse<void>;
  askCancel: (slotKey?: string) => AskResponse<void>;
  askRefresh: (slotKey?: string) => AskResponse<void>;
  askLoadHistory: (slotKey?: string) => AskResponse<void>;
  askLoadOlderHistory: (slotKey?: string) => AskResponse<void>;
};
