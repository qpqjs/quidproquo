import { actionResult, askConfigGetGlobalBase, createActionProcessor, ProcessorFor, QPQConfig, qpqCoreUtils } from '@qpqjs/core';

const getProcessConfigGetGlobal = (qpqConfig: QPQConfig): ProcessorFor<typeof askConfigGetGlobalBase> => {
  return async ({ globalName }, session) => {
    const globalValue = qpqCoreUtils.resolveGlobalValue(qpqConfig, session.functionGlobals, globalName);
    return actionResult(globalValue);
  };
};

export const getConfigGetGlobalActionProcessor = createActionProcessor(askConfigGetGlobalBase, getProcessConfigGetGlobal);
