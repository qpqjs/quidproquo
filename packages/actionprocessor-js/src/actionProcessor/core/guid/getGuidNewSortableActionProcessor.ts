import { actionResult, askNewSortableGuid, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { uuidv7 } from 'uuidv7';

const getProcessGuidNewSortable = (qpqConfig: QPQConfig): ProcessorFor<typeof askNewSortableGuid> => {
  return async () => {
    return actionResult(uuidv7());
  };
};

export const getGuidNewSortableActionProcessor = createActionProcessor(askNewSortableGuid, getProcessGuidNewSortable);
