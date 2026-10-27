import { QpqContext } from 'quidproquo-core';

import { createContext } from 'react';

export const qpqReactContext = createContext<QpqContext<any>>({});
