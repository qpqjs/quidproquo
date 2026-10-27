import { connectQpqStoreToReduxDevTools } from './connectQpqStoreToReduxDevTools';

export type QpqStoreEvent = {
  type: 'seed' | 'set_state' | 'release';
  areaKey: string;
};

export type QpqStoreOptions = {
  // Connect to the Redux DevTools browser extension under this instance name.
  // Opt-in so anonymous stores (tests, provider-owned) stay unconnected.
  devToolsName?: string;
};

export type QpqStore = {
  hasArea(areaKey: string): boolean;
  getAreaState(areaKey: string): unknown;
  setAreaState(areaKey: string, state: unknown): void;
  // Time-travel/hydration escape hatch: writes even while frozen, emits no
  // store event, and while frozen may resurrect an unbound area at count 0.
  restoreAreaState(areaKey: string, state: unknown): void;
  bindArea(areaKey: string, initialState: unknown): boolean;
  unbindArea(areaKey: string): void;
  subscribe(areaKey: string, listener: () => void): () => void;
  subscribeToStore(listener: (event: QpqStoreEvent) => void): () => void;
  getSnapshot(): Record<string, unknown>;
  // Frozen = the world is on pause (devtools time travel): live writes are
  // dropped, releases are deferred, and binders skip onInit. Thaw resumes
  // normal behaviour and sweeps areas nothing is bound to any more.
  freeze(): void;
  thaw(): void;
  isFrozen(): boolean;
};

type QpqStoreAreaEntry = {
  count: number;
  state: unknown;
};

// process.env is only defined when a bundler injects it, so reach through
// globalThis rather than referencing process directly.
const isDevEnvironment = (): boolean => {
  const nodeEnv = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV;
  return nodeEnv !== 'production';
};

export function createQpqStore(options?: QpqStoreOptions): QpqStore {
  const areas = new Map<string, QpqStoreAreaEntry>();

  // Listener lifetime is independent of area lifetime: React subscribes and
  // binds in separate effects, and an area can be deleted and re-seeded while
  // a subscriber from the same commit is still attached.
  const listenersByArea = new Map<string, Set<() => void>>();

  // Store-wide observers (devtools, logging) hear every mutation with what
  // happened; per-area subscribers just hear that their area changed.
  const storeListeners = new Set<(event: QpqStoreEvent) => void>();

  let frozen = false;

  const notifyArea = (areaKey: string): void => {
    const listeners = listenersByArea.get(areaKey);
    if (!listeners) {
      return;
    }

    for (const listener of [...listeners]) {
      listener();
    }
  };

  const notifyStore = (event: QpqStoreEvent): void => {
    for (const listener of [...storeListeners]) {
      listener(event);
    }
  };

  const store: QpqStore = {
    hasArea: (areaKey: string): boolean => areas.has(areaKey),

    getAreaState: (areaKey: string): unknown => areas.get(areaKey)?.state,

    setAreaState: (areaKey: string, state: unknown): void => {
      // Frozen: the app is displaying a devtools-restored moment; live writes
      // (in-flight stories, late fetches, websocket pushes) lose, silently,
      // so they cannot repaint the past.
      if (frozen) {
        return;
      }

      const area = areas.get(areaKey);

      // Smart pointer semantics: unbound state does not exist, late writers
      // (in-flight stories, websocket pushes) lose.
      if (!area) {
        if (isDevEnvironment()) {
          console.warn(`qpq store: dropped set_state for unbound area "${areaKey}"`);
        }
        return;
      }

      area.state = state;
      notifyArea(areaKey);
      notifyStore({ type: 'set_state', areaKey });
    },

    restoreAreaState: (areaKey: string, state: unknown): void => {
      const area = areas.get(areaKey);
      if (area) {
        area.state = state;
        notifyArea(areaKey);
        return;
      }

      // While frozen a restore may resurrect an area that was released before
      // the freeze: it sits at count 0 so a component popping in binds it
      // (count 0 -> 1, NOT a first bind) and renders the historical state
      // instead of fetching. Thaw sweeps whatever is still unbound.
      if (frozen) {
        areas.set(areaKey, { count: 0, state });
        notifyArea(areaKey);
      }
    },

    bindArea: (areaKey: string, initialState: unknown): boolean => {
      const area = areas.get(areaKey);
      if (area) {
        area.count += 1;
        return false;
      }

      areas.set(areaKey, { count: 1, state: initialState });

      // An unmount can delete the area in the same commit a mount re-seeds
      // it; subscribers must re-read or they keep rendering the deleted state.
      notifyArea(areaKey);
      notifyStore({ type: 'seed', areaKey });

      return true;
    },

    unbindArea: (areaKey: string): void => {
      const area = areas.get(areaKey);
      if (!area) {
        return;
      }

      area.count -= 1;
      if (area.count > 0) {
        return;
      }

      // Frozen: defer the delete (entry stays at count 0) so scrubbing
      // forward can rebind without losing state; thaw does the sweep.
      if (frozen) {
        return;
      }

      areas.delete(areaKey);
      notifyStore({ type: 'release', areaKey });
    },

    subscribe: (areaKey: string, listener: () => void): (() => void) => {
      let listeners = listenersByArea.get(areaKey);
      if (!listeners) {
        listeners = new Set();
        listenersByArea.set(areaKey, listeners);
      }

      listeners.add(listener);

      const capturedListeners = listeners;
      return () => {
        capturedListeners.delete(listener);

        // Only drop the map entry if it still holds this set; another
        // subscriber may have recreated it after we emptied out.
        if (capturedListeners.size === 0 && listenersByArea.get(areaKey) === capturedListeners) {
          listenersByArea.delete(areaKey);
        }
      };
    },

    subscribeToStore: (listener: (event: QpqStoreEvent) => void): (() => void) => {
      storeListeners.add(listener);
      return () => {
        storeListeners.delete(listener);
      };
    },

    // The entire live app state as one plain object, one key per bound area.
    getSnapshot: (): Record<string, unknown> => {
      const snapshot: Record<string, unknown> = {};
      for (const [areaKey, area] of areas) {
        snapshot[areaKey] = area.state;
      }
      return snapshot;
    },

    freeze: (): void => {
      frozen = true;
    },

    thaw: (): void => {
      if (!frozen) {
        return;
      }

      frozen = false;

      // Sweep the deferred releases and time-travel resurrections nothing is
      // bound to any more.
      for (const [areaKey, area] of [...areas]) {
        if (area.count <= 0) {
          areas.delete(areaKey);
          notifyStore({ type: 'release', areaKey });
        }
      }
    },

    isFrozen: (): boolean => frozen,
  };

  if (options?.devToolsName) {
    connectQpqStoreToReduxDevTools(store, options.devToolsName);
  }

  return store;
}
