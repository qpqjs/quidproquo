import { createContextIdentifier } from '@qpqjs/core';

import type { EventDocAiContext } from '../models';

const eventDocAiContextDefaultValue: EventDocAiContext = {
  serviceName: '',
  type: '',
  docId: '',
};

/** The document an AI chat is working on, provided by the event doc AI entry points. Empty strings outside one. */
export const eventDocAiContext = createContextIdentifier('qpq-event-doc-ai', eventDocAiContextDefaultValue);
