import { useContext } from 'react';

import { QpqStore } from './createQpqStore';
import { qpqStoreContext } from './qpqStoreContext';

export const useQpqStore = (): QpqStore => {
  const store = useContext(qpqStoreContext);

  if (!store) {
    throw new Error('useQpqStore must be used inside a QpqStoreProvider');
  }

  return store;
};
