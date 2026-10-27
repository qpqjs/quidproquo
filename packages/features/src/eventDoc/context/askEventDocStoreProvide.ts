import { createContextProvider } from 'quidproquo-core';

import { EventDocStore } from '../types/EventDocStore';
import { eventDocStoreContext } from './eventDocStoreContext';

/** Provides an EventDocStore on the local context for the wrapped story. */
export const askEventDocStoreProvide = createContextProvider(eventDocStoreContext, (store: EventDocStore) => store);
