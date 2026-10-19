import { AskResponse } from 'quidproquo-core';

import { EventDocWorkspaceDocumentIdentity } from './EventDocWorkspaceDocumentIdentity';
import { EventDocWorkspaceSnapshot } from './EventDocWorkspaceSnapshot';

/**
 * The workspace's built-in verbs. slotKey omitted means every document slot. askInit's snapshot restores a prior runtime's
 * state per identity-matched slot; askRefresh tail-pulls, askResync rebuilds base and history from the server's bootstrap
 * (pending kept); askLoadHistory/askLoadOlderHistory page the display history newest first. askSyncHeadMoved answers a
 * server push that the document's log now ends at headEventId: a tail pull unless the slot already holds it, is saving,
 * or the push is the slot's own in-flight save.
 */
export type EventDocWorkspaceBuiltInApi = {
  askInit: (identities: Record<string, EventDocWorkspaceDocumentIdentity>, snapshot?: EventDocWorkspaceSnapshot) => AskResponse<void>;
  askSave: (slotKey?: string) => AskResponse<void>;
  askCancel: (slotKey?: string) => AskResponse<void>;
  askRefresh: (slotKey?: string) => AskResponse<void>;
  askResync: (slotKey?: string) => AskResponse<void>;
  askSyncHeadMoved: (slotKey: string, headEventId: number, clientMessageId?: string) => AskResponse<void>;
  askLoadHistory: (slotKey?: string) => AskResponse<void>;
  askLoadOlderHistory: (slotKey?: string) => AskResponse<void>;
};
