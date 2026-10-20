import { askMapParallel, AskResponse, Nullable } from 'quidproquo-core';

import { EventDocEvent, EventDocSnapshotBase } from '../../models';
import { askUIEventDocWorkspaceClearError } from '../actionCreators/askUIEventDocWorkspaceClearError';
import { askUIEventDocWorkspaceSetDocumentIdentity } from '../actionCreators/askUIEventDocWorkspaceSetDocumentIdentity';
import { askUIEventDocWorkspaceSetHistoryEvents } from '../actionCreators/askUIEventDocWorkspaceSetHistoryEvents';
import { askUIEventDocWorkspaceSetLoading } from '../actionCreators/askUIEventDocWorkspaceSetLoading';
import { askUIEventDocWorkspaceSetPendingEvents } from '../actionCreators/askUIEventDocWorkspaceSetPendingEvents';
import { EventDocWorkspaceDocumentIdentity } from '../types/EventDocWorkspaceDocumentIdentity';
import { EventDocWorkspaceSlotFoldsConfig } from '../types/EventDocWorkspaceSlotFoldsConfig';
import { EventDocWorkspaceSlotSnapshot, EventDocWorkspaceSnapshot } from '../types/EventDocWorkspaceSnapshot';
import { EventDocWorkspaceTransport } from '../types/EventDocWorkspaceTransport';
import { askEventDocWorkspaceRefresh } from './askEventDocWorkspaceRefresh';
import { askEventDocWorkspaceResync } from './askEventDocWorkspaceResync';
import { isSameEventDocWorkspaceIdentity } from './isSameEventDocWorkspaceIdentity';

// Runtime hand-off: seed history and pending from the snapshot so the view renders at once, then tail-pull what landed since.
const getAskInitDocumentSlotFromSnapshot = (transport: EventDocWorkspaceTransport, slots: EventDocWorkspaceSlotFoldsConfig) =>
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

    yield* askEventDocWorkspaceRefresh(transport, slots, [slotKey]);
  };

// Was a captured base produced by the fold code this slot runs now? A base records the snapshotCacheKey it was filed
// under; the slot's definition declares the key it folds with. Different keys mean the base is old fold output, so the
// slot must bootstrap from the server (which serves a base under the current key). No base at all (a whole-log history)
// has nothing to go stale. '' on either side is the legacy layout.
const isBaseFromCurrentFold = (base: Nullable<EventDocSnapshotBase> | undefined, slotSnapshotCacheKey: string): boolean =>
  !base || (base.snapshotCacheKey ?? '') === slotSnapshotCacheKey;

// Pending is dropped unless the snapshot slot's identity matches, and it is seeded before the fetch so a failed load never discards it.
const getAskInitDocumentSlot = (
  transport: EventDocWorkspaceTransport,
  slots: EventDocWorkspaceSlotFoldsConfig,
  snapshot: Nullable<EventDocWorkspaceSnapshot>,
  slotSnapshotCacheKeys: Record<string, string>,
) =>
  function* askInitDocumentSlot([slotKey, documentIdentity]: [string, EventDocWorkspaceDocumentIdentity]): AskResponse<void> {
    const snapshotSlot: EventDocWorkspaceSlotSnapshot | undefined = snapshot?.slots[slotKey];
    const snapshotMatches = !!snapshotSlot && isSameEventDocWorkspaceIdentity(snapshotSlot.documentIdentity, documentIdentity);

    // Instant restore needs all three: same document, a captured history (a caller strips it to force a refetch), and a
    // base from the current fold code. Otherwise the slot restores pending only and takes the blocking load.
    const capturedHistory = snapshotMatches ? snapshotSlot.history : undefined;
    const canRestoreFromSnapshot =
      snapshotMatches && !!capturedHistory && isBaseFromCurrentFold(snapshotSlot.base, slotSnapshotCacheKeys[slotKey] ?? '');

    if (canRestoreFromSnapshot) {
      yield* getAskInitDocumentSlotFromSnapshot(transport, slots)(
        slotKey,
        documentIdentity,
        capturedHistory,
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
    yield* askEventDocWorkspaceResync(transport, slots, slotKey);
    yield* askUIEventDocWorkspaceSetLoading(slotKey, false);
  };

/**
 * Initialises the requested document slots in parallel: identity, pending (restored from a matching snapshot slot), then the
 * bootstrap load, which rebases the restored pending. `slotSnapshotCacheKeys` is each document slot's definition key, for
 * judging a held base.
 */
export function* askEventDocWorkspaceInit(
  transport: EventDocWorkspaceTransport,
  slots: EventDocWorkspaceSlotFoldsConfig,
  identities: Record<string, EventDocWorkspaceDocumentIdentity>,
  snapshot: Nullable<EventDocWorkspaceSnapshot> = null,
  slotSnapshotCacheKeys: Record<string, string> = {},
): AskResponse<void> {
  yield* askMapParallel(Object.entries(identities), getAskInitDocumentSlot(transport, slots, snapshot, slotSnapshotCacheKeys));
}
