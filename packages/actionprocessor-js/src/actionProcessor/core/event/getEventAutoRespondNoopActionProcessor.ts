import { actionResult, askEventAutoRespondBase, createActionProcessor, ProcessorFor } from '@qpqjs/core';

const getProcessAutoRespond = (): ProcessorFor<typeof askEventAutoRespondBase> => {
  return async () => actionResult(null);
};

/** For event sources that never answer before the story runs: every runtime spreads this one instead of keeping a copy. */
export const getEventAutoRespondNoopActionProcessor = createActionProcessor(askEventAutoRespondBase, getProcessAutoRespond);
