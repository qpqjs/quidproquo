import { createContextProvider } from '@qpqjs/core';

import type { EventDocAiContext } from '../models';
import { eventDocAiContext } from './eventDocAiContext';

export const askEventDocAiProvide = createContextProvider(eventDocAiContext, (context: EventDocAiContext) => context);
