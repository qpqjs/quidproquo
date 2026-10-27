import { ReactNode, useState } from 'react';

import { createQpqStore, QpqStore } from './createQpqStore';
import { qpqStoreContext } from './qpqStoreContext';

type QpqStoreProviderProps = {
  // Pass a store the app created itself when imperative (non-react) code also
  // needs to read it; omitted, the provider creates and owns one.
  store?: QpqStore;
  children: ReactNode;
};

export const QpqStoreProvider = ({ store, children }: QpqStoreProviderProps) => {
  const [ownStore] = useState(createQpqStore);

  return <qpqStoreContext.Provider value={store ?? ownStore}>{children}</qpqStoreContext.Provider>;
};
