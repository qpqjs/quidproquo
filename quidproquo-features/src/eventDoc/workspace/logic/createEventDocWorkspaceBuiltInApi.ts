import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { EventDocWorkspaceBuiltInApi } from '../types/EventDocWorkspaceBuiltInApi';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { EventDocWorkspaceSnapshot } from '../types/EventDocWorkspaceSnapshot';
import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceCancel } from './askEventDocWorkspaceCancel';
import { askEventDocWorkspaceInit } from './askEventDocWorkspaceInit';
import { askEventDocWorkspaceLoadFullHistory, askEventDocWorkspaceLoadOlderHistory } from './askEventDocWorkspaceLoadFullHistory';
import { askEventDocWorkspaceRefresh } from './askEventDocWorkspaceRefresh';
import { askEventDocWorkspaceRestoreLocalPending } from './askEventDocWorkspaceRestoreLocalPending';
import { askEventDocWorkspaceSave } from './askEventDocWorkspaceSave';

// The transport is optional so all-local workspaces stay zero-config; transport verbs fail loudly without one.
function* askEnsureTransport(transport?: EventDocWorkspaceTransport): AskResponse<EventDocWorkspaceTransport> {
  if (!transport) {
    return yield* askThrowError(
      ErrorTypeEnum.Invalid,
      'This EventDocWorkspace was created without a transport - pass one to createEventDocWorkspace to use init/save/refresh.',
    );
  }

  return transport;
}

const resolveSlotKeys = (documentSlotKeys: string[], slotKey?: string): string[] =>
  slotKey === undefined ? documentSlotKeys : documentSlotKeys.filter((documentSlotKey) => documentSlotKey === slotKey);

const getAskInit = (transport: EventDocWorkspaceTransport | undefined, documentSlotKeys: string[], localSlotKeys: string[]) =>
  function* askInit(identities: Record<string, EventDocWorkspaceDocumentIdentity>, snapshot?: EventDocWorkspaceSnapshot): AskResponse<void> {
    yield* askEventDocWorkspaceRestoreLocalPending(snapshot ?? null, localSlotKeys);

    // Unknown keys are dropped rather than growing phantom slots.
    const known = Object.fromEntries(Object.entries(identities).filter(([slotKey]) => documentSlotKeys.includes(slotKey)));

    yield* askEventDocWorkspaceInit(yield* askEnsureTransport(transport), known, snapshot ?? null);
  };

const getAskSave = (transport: EventDocWorkspaceTransport | undefined, documentSlotKeys: string[]) =>
  function* askSave(slotKey?: string): AskResponse<void> {
    yield* askEventDocWorkspaceSave(yield* askEnsureTransport(transport), resolveSlotKeys(documentSlotKeys, slotKey));
  };

const getAskCancel = (documentSlotKeys: string[]) =>
  function* askCancel(slotKey?: string): AskResponse<void> {
    yield* askEventDocWorkspaceCancel(resolveSlotKeys(documentSlotKeys, slotKey));
  };

const getAskRefresh = (transport: EventDocWorkspaceTransport | undefined, documentSlotKeys: string[]) =>
  function* askRefresh(slotKey?: string): AskResponse<void> {
    yield* askEventDocWorkspaceRefresh(yield* askEnsureTransport(transport), resolveSlotKeys(documentSlotKeys, slotKey));
  };

const getAskLoadHistory = (transport: EventDocWorkspaceTransport | undefined, documentSlotKeys: string[]) =>
  function* askLoadHistory(slotKey?: string): AskResponse<void> {
    yield* askEventDocWorkspaceLoadFullHistory(yield* askEnsureTransport(transport), resolveSlotKeys(documentSlotKeys, slotKey));
  };

const getAskLoadOlderHistory = (transport: EventDocWorkspaceTransport | undefined, documentSlotKeys: string[]) =>
  function* askLoadOlderHistory(slotKey?: string): AskResponse<void> {
    yield* askEventDocWorkspaceLoadOlderHistory(yield* askEnsureTransport(transport), resolveSlotKeys(documentSlotKeys, slotKey));
  };

/** Builds the workspace's built-in init/save/cancel/refresh/history verbs. slotKey omitted means every document slot. */
export const createEventDocWorkspaceBuiltInApi = (
  transport: EventDocWorkspaceTransport | undefined,
  documentSlotKeys: string[],
  localSlotKeys: string[],
): EventDocWorkspaceBuiltInApi => ({
  askInit: getAskInit(transport, documentSlotKeys, localSlotKeys),
  askSave: getAskSave(transport, documentSlotKeys),
  askCancel: getAskCancel(documentSlotKeys),
  askRefresh: getAskRefresh(transport, documentSlotKeys),
  askLoadHistory: getAskLoadHistory(transport, documentSlotKeys),
  askLoadOlderHistory: getAskLoadOlderHistory(transport, documentSlotKeys),
});
