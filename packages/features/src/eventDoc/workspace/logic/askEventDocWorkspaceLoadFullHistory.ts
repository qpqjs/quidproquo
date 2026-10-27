import { askCatch, askMapParallel, AskResponse } from 'quidproquo-core';

import { askUIEventDocWorkspaceAppendFullHistory } from '../actionCreators/askUIEventDocWorkspaceAppendFullHistory';
import { askUIEventDocWorkspaceClearError } from '../actionCreators/askUIEventDocWorkspaceClearError';
import { askUIEventDocWorkspaceSetError } from '../actionCreators/askUIEventDocWorkspaceSetError';
import { askUIEventDocWorkspaceSetFullHistory } from '../actionCreators/askUIEventDocWorkspaceSetFullHistory';
import { EVENT_DOC_WORKSPACE_HISTORY_PAGE_SIZE } from '../constants/eventDocWorkspaceHistoryPageSize';
import { EventDocWorkspaceSlotOperation } from '../types/EventDocWorkspaceSlotOperation';
import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceReadState } from './askEventDocWorkspaceReadState';

const getAskLoadSlotFullHistory = (transport: EventDocWorkspaceTransport) =>
  function* askLoadSlotFullHistory(slotKey: string): AskResponse<void> {
    const state = yield* askEventDocWorkspaceReadState();
    const documentIdentity = state.slots[slotKey]?.documentIdentity;

    if (!documentIdentity) {
      return;
    }

    yield* askUIEventDocWorkspaceClearError(slotKey);

    const result = yield* askCatch(
      transport.askFetchEventsPage(documentIdentity, { newestFirst: true, limit: EVENT_DOC_WORKSPACE_HISTORY_PAGE_SIZE }),
    );

    if (!result.success) {
      yield* askUIEventDocWorkspaceSetError(slotKey, { operation: EventDocWorkspaceSlotOperation.load, error: result.error });
      return;
    }

    yield* askUIEventDocWorkspaceSetFullHistory(slotKey, { events: result.result.items, nextPageKey: result.result.nextPageKey });
  };

const getAskLoadSlotOlderHistory = (transport: EventDocWorkspaceTransport) =>
  function* askLoadSlotOlderHistory(slotKey: string): AskResponse<void> {
    const state = yield* askEventDocWorkspaceReadState();
    const documentIdentity = state.slots[slotKey]?.documentIdentity;
    const current = state.fullHistory[slotKey];

    if (!documentIdentity || !current?.nextPageKey) {
      return;
    }

    yield* askUIEventDocWorkspaceClearError(slotKey);

    const result = yield* askCatch(
      transport.askFetchEventsPage(documentIdentity, {
        newestFirst: true,
        limit: EVENT_DOC_WORKSPACE_HISTORY_PAGE_SIZE,
        nextPageKey: current.nextPageKey,
      }),
    );

    if (!result.success) {
      yield* askUIEventDocWorkspaceSetError(slotKey, { operation: EventDocWorkspaceSlotOperation.load, error: result.error });
      return;
    }

    yield* askUIEventDocWorkspaceAppendFullHistory(slotKey, result.result.items, result.result.nextPageKey);
  };

/**
 * Loads the latest newest-first page of each slot's saved log into fullHistory, replacing what was there. Slots with no
 * identity are skipped.
 */
export function* askEventDocWorkspaceLoadFullHistory(transport: EventDocWorkspaceTransport, slotKeys: string[]): AskResponse<void> {
  yield* askMapParallel(slotKeys, getAskLoadSlotFullHistory(transport));
}

/** Appends the next older page to each slot's fullHistory; skipped when there is no page or cursor to continue from. */
export function* askEventDocWorkspaceLoadOlderHistory(transport: EventDocWorkspaceTransport, slotKeys: string[]): AskResponse<void> {
  yield* askMapParallel(slotKeys, getAskLoadSlotOlderHistory(transport));
}
