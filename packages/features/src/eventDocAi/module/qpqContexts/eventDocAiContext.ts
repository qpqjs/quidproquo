import { createContextIdentifier, createContextProvider, createContextReader } from 'quidproquo-core';

import type { EventDocAiContext } from '../../models';

const eventDocAiContextDefaultValue: EventDocAiContext = {
  serviceName: '',
  type: '',
  docId: '',
};

export const eventDocAiContext = createContextIdentifier('event-doc-ai-context', eventDocAiContextDefaultValue);

export const askEventDocAiContextRead = createContextReader(eventDocAiContext);

export const askEventDocAiContextProvide = createContextProvider(eventDocAiContext, (context: EventDocAiContext) => context);
