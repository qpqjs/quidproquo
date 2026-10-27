import { Nullable } from 'quidproquo-core';

import { createContext } from 'react';

import { QpqStore } from './createQpqStore';

export const qpqStoreContext = createContext<Nullable<QpqStore>>(null);
