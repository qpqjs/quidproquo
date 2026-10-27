import { QpqContext } from '@qpqjs/core';

import { createContext } from 'react';

export const qpqReactContext = createContext<QpqContext<any>>({});
