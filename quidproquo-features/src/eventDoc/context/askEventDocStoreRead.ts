import { createContextReader } from 'quidproquo-core';

import { eventDocStoreContext } from './eventDocStoreContext';

/** Reads the EventDocStore context. Prefer askEventDocResolveStore, which throws when unprovided. */
export const askEventDocStoreRead = createContextReader(eventDocStoreContext);
