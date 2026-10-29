import { actionResult, askEventGetStorySessionBase, createActionProcessor, ProcessorFor } from '@qpqjs/core';

const getProcessGetStorySession = (): ProcessorFor<typeof askEventGetStorySessionBase> => {
  return async () => actionResult(undefined);
};

/** For event sources whose records carry no story session: every runtime spreads this one instead of keeping a copy. */
export const getEventGetStorySessionNoopActionProcessor = createActionProcessor(askEventGetStorySessionBase, getProcessGetStorySession);
