import { createContextReader } from '@qpqjs/core';

import { eventDocStoreContext } from './eventDocStoreContext';

/** Reads the EventDocStore context. Prefer askEventDocStoreReadOrThrow, which throws when unprovided. */
export const askEventDocStoreRead = createContextReader(eventDocStoreContext);
