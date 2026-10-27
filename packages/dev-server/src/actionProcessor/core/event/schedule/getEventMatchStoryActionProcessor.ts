import { actionResult, askEventMatchStoryBase, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { EventInput, MatchResult } from './types';

// The schedule's runtime travels with the message. Deployed, the equivalent
// processor reads it out of a lambda env var, because one lambda serves one
// schedule; locally one process serves all of them, so it has to come from the
// message that says which one fired.
const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  return async ({ eventParams }) => {
    const [event] = eventParams as EventInput;

    return actionResult<MatchResult>({ runtime: event.runtime, runtimeOptions: {} });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
