import { askCatch, askMapParallel, AskResponse, Nullable } from 'quidproquo-core';

import { EventDocEvent, EventDocSnapshotBase } from '../../models';
import { askUIEventDocWorkspaceClearError } from '../actionCreators/askUIEventDocWorkspaceClearError';
import { askUIEventDocWorkspaceSetDocumentIdentity } from '../actionCreators/askUIEventDocWorkspaceSetDocumentIdentity';
import { askUIEventDocWorkspaceSetError } from '../actionCreators/askUIEventDocWorkspaceSetError';
import { askUIEventDocWorkspaceSetHistoryEvents } from '../actionCreators/askUIEventDocWorkspaceSetHistoryEvents';
import { askUIEventDocWorkspaceSetLoading } from '../actionCreators/askUIEventDocWorkspaceSetLoading';
import { askUIEventDocWorkspaceSetPendingEvents } from '../actionCreators/askUIEventDocWorkspaceSetPendingEvents';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { EventDocWorkspaceSlotOperation } from '../types/EventDocWorkspaceSlotOperation';
import { EventDocWorkspaceSlotSnapshot, EventDocWorkspaceSnapshot } from '../types/EventDocWorkspaceSnapshot';
import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceRefresh } from './askEventDocWorkspaceRefresh';
import { isSameEventDocWorkspaceIdentity } from './isSameEventDocWorkspaceIdentity';

// Runtime hand-off: seed history and pending from the snapshot so the view renders at once, then tail-pull what landed since.
const getAskInitDocumentSlotFromSnapshot = (transport: EventDocWorkspaceTransport) =>
  function* askInitDocumentSlotFromSnapshot(
    slotKey: string,
    documentIdentity: EventDocWorkspaceDocumentIdentity,
    history: EventDocEvent[],
    pending: EventDocEvent[],
    base: Nullable<EventDocSnapshotBase>,
  ): AskResponse<void> {
    yield* askUIEventDocWorkspaceSetDocumentIdentity(slotKey, documentIdentity);
    yield* askUIEventDocWorkspaceSetHistoryEvents(slotKey, history, base);
    yield* askUIEventDocWorkspaceSetPendingEvents(slotKey, pending);
    yield* askUIEventDocWorkspaceClearError(slotKey);

    yield* askEventDocWorkspaceRefresh(transport, [slotKey]);
  };

// Pending is dropped unless the snapshot slot's identity matches, and it is seeded before the fetch so a failed load never discards it.
const getAskInitDocumentSlot = (transport: EventDocWorkspaceTransport, snapshot: Nullable<EventDocWorkspaceSnapshot>) =>
  function* askInitDocumentSlot([slotKey, documentIdentity]: [string, EventDocWorkspaceDocumentIdentity]): AskResponse<void> {
    const snapshotSlot: EventDocWorkspaceSlotSnapshot | undefined = snapshot?.slots[slotKey];
    const snapshotMatches = !!snapshotSlot && isSameEventDocWorkspaceIdentity(snapshotSlot.documentIdentity, documentIdentity);

    // A matching snapshot without history (stripped to force a refetch) restores pending only and takes the blocking load.
    if (snapshotMatches && snapshotSlot.history) {
      yield* getAskInitDocumentSlotFromSnapshot(transport)(
        slotKey,
        documentIdentity,
        snapshotSlot.history,
        snapshotSlot.pending,
        snapshotSlot.base ?? null,
      );
      return;
    }

    const preservedPending: EventDocEvent[] = snapshotMatches ? snapshotSlot.pending : [];

    yield* askUIEventDocWorkspaceSetDocumentIdentity(slotKey, documentIdentity);
    yield* askUIEventDocWorkspaceSetPendingEvents(slotKey, preservedPending);
    yield* askUIEventDocWorkspaceClearError(slotKey);
    yield* askUIEventDocWorkspaceSetLoading(slotKey, true);

    const result = yield* askCatch(transport.askFetchBootstrap(documentIdentity));

    if (!result.success) {
      yield* askUIEventDocWorkspaceSetError(slotKey, { operation: EventDocWorkspaceSlotOperation.load, error: result.error });
      yield* askUIEventDocWorkspaceSetLoading(slotKey, false);
      return;
    }

    yield* askUIEventDocWorkspaceSetHistoryEvents(slotKey, result.result.events, result.result.base);

    if (preservedPending.length > 0) {
      yield* askUIEventDocWorkspaceSetPendingEvents(slotKey, preservedPending);
    }

    yield* askUIEventDocWorkspaceSetLoading(slotKey, false);
  };

/**
 * Initialises the requested document slots in parallel: identity, pending (restored from a matching snapshot slot), then the
 * bootstrap load.
 */
export function* askEventDocWorkspaceInit(
  transport: EventDocWorkspaceTransport,
  identities: Record<string, EventDocWorkspaceDocumentIdentity>,
  snapshot: Nullable<EventDocWorkspaceSnapshot> = null,
): AskResponse<void> {
  yield* askMapParallel(Object.entries(identities), getAskInitDocumentSlot(transport, snapshot));
}
