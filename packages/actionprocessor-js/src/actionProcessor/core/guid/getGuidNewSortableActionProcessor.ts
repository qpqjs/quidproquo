import { actionResult, askGuidNewSortable, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { uuidv7 } from 'uuidv7';

const getProcessGuidNewSortable = (qpqConfig: QPQConfig): ProcessorFor<typeof askGuidNewSortable> => {
  return async () => {
    return actionResult(uuidv7());
  };
};

export const getGuidNewSortableActionProcessor = createActionProcessor(askGuidNewSortable, getProcessGuidNewSortable);
