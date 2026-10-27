import { ActionProcessorListResolver } from '@qpqjs/core';

import { createContext } from 'react';

export const ActionProcessorContext = createContext<ActionProcessorListResolver>(async () => ({}));
