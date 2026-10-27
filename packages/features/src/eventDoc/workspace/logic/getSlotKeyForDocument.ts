import { Nullable } from '@qpqjs/core';

import { EventDocWorkspaceState } from '../types/EventDocWorkspaceState';

/**
 * The document slot currently bound to `docId` in the collection `storeName`, or null. `storeNames` is the workspace's
 * slot-to-store map; a slot not in it can never match.
 */
export const getSlotKeyForDocument = (
  state: EventDocWorkspaceState,
  storeNames: Record<string, string>,
  storeName: string,
  docId: string,
): Nullable<string> =>
  Object.entries(storeNames).find(
    ([slotKey, slotStoreName]) => slotStoreName === storeName && state.slots[slotKey]?.documentIdentity?.id === docId,
  )?.[0] ?? null;
