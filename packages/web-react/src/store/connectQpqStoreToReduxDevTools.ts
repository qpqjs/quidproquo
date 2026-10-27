// Type-only: createQpqStore imports this module at runtime (to honour
// devToolsName), so the back-edge must stay erasable.
import type { QpqStore } from './createQpqStore';

type ReduxDevToolsMessage = {
  type: string;
  payload?: { type?: string; actionId?: number; status?: boolean };
  state?: string;
};

type ReduxDevToolsConnection = {
  init(state: unknown): void;
  send(action: { type: string }, state: unknown): void;
  subscribe?(listener: (message: ReduxDevToolsMessage) => void): (() => void) | undefined;
};

type ReduxDevToolsExtension = {
  connect(options: { name: string; features?: Record<string, boolean> }): ReduxDevToolsConnection;
};

// The buttons we can honour. Skip/reorder stay off: they need replaying the
// effect log through the binders' reducers, which live outside the store.
const DEVTOOLS_FEATURES: Record<string, boolean> = {
  pause: false,
  lock: true,
  persist: false,
  export: true,
  import: false,
  jump: true,
  skip: false,
  reorder: false,
  dispatch: false,
  test: false,
};

// Wires a qpq store to the Redux DevTools browser extension: the devtools
// state pane shows the ENTIRE app state (one key per bound area), every
// seed / set_state / release lands as a named action with diffs, and the
// jump/slider controls time travel the store.
//
// Time travel freezes the world automatically: any jump away from the newest
// action freezes the store (live writes dropped, releases deferred, onInit
// skipped, sends muted), and jumping back to the newest action thaws it.
// While frozen, restores can resurrect released areas at count 0, so
// components popping in render the historical state instead of fetching.
// The extension's lock button is a manual freeze with the same semantics,
// and COMMIT adopts whatever is on screen as the new present.
//
// A noop returning a noop when the extension is not installed, so call it
// unconditionally right after creating the store.
export const connectQpqStoreToReduxDevTools = (store: QpqStore, name: string = 'qpq-store'): (() => void) => {
  const extension = (globalThis as { __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevToolsExtension }).__REDUX_DEVTOOLS_EXTENSION__;

  if (!extension) {
    return () => {};
  }

  const connection = extension.connect({ name, features: DEVTOOLS_FEATURES });

  // Mirrors the extension's action ids (@@INIT is 0, each send increments,
  // init resets) so a jump back onto the newest action is recognisable as
  // "back at head". If a jump arrives without an actionId the store stays
  // frozen; lock-off or COMMIT are the manual ways out.
  let latestActionId = 0;
  let isJumpedAwayFromHead = false;
  let isLockedByUser = false;

  const syncFrozen = (): void => {
    if (isJumpedAwayFromHead || isLockedByUser) {
      store.freeze();
    } else {
      store.thaw();
    }
  };

  const restoreSnapshot = (snapshot: Record<string, unknown>): void => {
    for (const [areaKey, areaState] of Object.entries(snapshot)) {
      store.restoreAreaState(areaKey, areaState);
    }
  };

  const parseSerializedState = (serializedState: string): Record<string, unknown> | undefined => {
    try {
      return JSON.parse(serializedState) as Record<string, unknown>;
    } catch {
      console.warn('qpq store devtools: could not parse time-travel state, ignoring jump');
      return undefined;
    }
  };

  // RESET returns to this baseline; COMMIT moves it to the present.
  let committedSnapshot = store.getSnapshot();
  connection.init(committedSnapshot);

  const handleJump = (message: ReduxDevToolsMessage): void => {
    const snapshot = message.state ? parseSerializedState(message.state) : undefined;
    if (!snapshot) {
      return;
    }

    isJumpedAwayFromHead = message.payload?.actionId !== latestActionId;

    // Freeze before restoring so a jump into the past can resurrect released
    // areas; on the jump back to head, restore first and thaw after so the
    // sweep sees final bind counts.
    if (isJumpedAwayFromHead) {
      syncFrozen();
      restoreSnapshot(snapshot);
    } else {
      restoreSnapshot(snapshot);
      syncFrozen();
    }
  };

  const handleDevToolsMessage = (message: ReduxDevToolsMessage): void => {
    if (message.type !== 'DISPATCH') {
      return;
    }

    const payloadType = message.payload?.type;

    if (payloadType === 'JUMP_TO_ACTION' || payloadType === 'JUMP_TO_STATE') {
      handleJump(message);
      return;
    }

    if (payloadType === 'LOCK_CHANGES') {
      isLockedByUser = message.payload?.status === true;
      syncFrozen();
      return;
    }

    // Adopt whatever is on screen (possibly a jumped-to past) as the new
    // present: thaw first so the sweep runs, then rebase the baseline.
    if (payloadType === 'COMMIT') {
      isJumpedAwayFromHead = false;
      syncFrozen();
      committedSnapshot = store.getSnapshot();
      connection.init(committedSnapshot);
      latestActionId = 0;
      return;
    }

    if (payloadType === 'ROLLBACK' || payloadType === 'RESET') {
      const snapshot = payloadType === 'ROLLBACK' && message.state ? parseSerializedState(message.state) : committedSnapshot;
      if (!snapshot) {
        return;
      }

      restoreSnapshot(snapshot);
      isJumpedAwayFromHead = false;
      syncFrozen();
      connection.init(store.getSnapshot());
      latestActionId = 0;
    }
  };
  const unsubscribeDevTools = connection.subscribe?.(handleDevToolsMessage);

  const unsubscribeStore = store.subscribeToStore((event) => {
    // Frozen means the world is on pause: seeds from pop-ins mid-scrub are
    // history echoes, not new activity, and must not grow the action log.
    if (store.isFrozen()) {
      return;
    }

    latestActionId += 1;
    connection.send({ type: `${event.type}: ${event.areaKey}` }, store.getSnapshot());
  });

  return () => {
    unsubscribeStore();
    unsubscribeDevTools?.();
  };
};
