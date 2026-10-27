import { ActionProcessorListResolver } from 'quidproquo-core';

import { createContext } from 'react';

export const ActionProcessorContext = createContext<ActionProcessorListResolver>(async () => ({}));
