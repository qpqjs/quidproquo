// Node 22+ ships a localStorage global that, without --localstorage-file, is a
// stub object with no Storage methods. Vitest's jsdom environment aliases
// window to globalThis, so that stub shadows the real jsdom storage and every
// localStorage call in a test explodes. Replace it with a functional in-memory
// Storage so the config processors can be tested.
const createInMemoryStorage = (): Storage => {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store.clear();
    },
    getItem: (key: string) => (store.has(key) ? (store.get(key) as string) : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
};

const hasWorkingLocalStorage = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function';

if (!hasWorkingLocalStorage) {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: createInMemoryStorage(),
  });
}
