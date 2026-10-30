import { actionResult, askGuidNewSortableMany, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { uuidv7 } from 'uuidv7';

// Sequential uuidv7() calls are monotonic within a process (the generator's
// counter bits order same-millisecond mints), so array order IS sort order.
const getProcessGuidNewSortableMany = (qpqConfig: QPQConfig): ProcessorFor<typeof askGuidNewSortableMany> => {
  return async ({ count }) => {
    return actionResult(Array.from({ length: count }, () => uuidv7()));
  };
};

export const getGuidNewSortableManyActionProcessor = createActionProcessor(askGuidNewSortableMany, getProcessGuidNewSortableMany);
