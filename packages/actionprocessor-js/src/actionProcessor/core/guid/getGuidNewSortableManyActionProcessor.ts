import { actionResult, askNewSortableGuids, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { uuidv7 } from 'uuidv7';

// Sequential uuidv7() calls are monotonic within a process (the generator's
// counter bits order same-millisecond mints), so array order IS sort order.
const getProcessGuidNewSortableMany = (qpqConfig: QPQConfig): ProcessorFor<typeof askNewSortableGuids> => {
  return async ({ count }) => {
    return actionResult(Array.from({ length: count }, () => uuidv7()));
  };
};

export const getGuidNewSortableManyActionProcessor = createActionProcessor(askNewSortableGuids, getProcessGuidNewSortableMany);
