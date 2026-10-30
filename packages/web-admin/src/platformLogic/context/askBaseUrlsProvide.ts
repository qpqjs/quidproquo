import { createContextProvider } from '@qpqjs/core';

import { BaseUrls } from '../types/BaseUrls';
import { baseUrlsContext } from './baseUrlsContext';

export const askBaseUrlsProvide = createContextProvider(baseUrlsContext, (baseUrls: BaseUrls) => baseUrls);
