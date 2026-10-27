import { actionResult, askEventMatchStoryBase, createActionProcessor, EventActionType, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { EventInput, InternalEventRecord, MatchResult } from './types';

// The store's configured handler travels with the message: the backend already resolved it
// from the store config when it decided to emit at all.
const getProcessMatchStory = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventMatchStoryBase> => {
  // Registered for one event source only, so the base requester's source-agnostic
  // payload is narrowed to this source's types here.
  return async ({ eventParams }) => {
    const [event] = eventParams as EventInput;

    return actionResult<MatchResult>({ runtime: event.runtime });
  };
};

export const getEventMatchStoryActionProcessor = createActionProcessor(askEventMatchStoryBase, getProcessMatchStory);
