import { createContextReader } from '@qpqjs/core';

import { baseUrlsContext } from './baseUrlsContext';

export const askBaseUrlsRead = createContextReader(baseUrlsContext);
