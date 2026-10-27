import { actionResult, askLogDisableEventHistory, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

const getProcessLogDisableEventHistory = (qpqConfig: QPQConfig): ProcessorFor<typeof askLogDisableEventHistory> => {
  return async ({ enable, reason }, session, _actionProcessors, logger) => {
    await logger.enableLogs(enable, reason, session.correlation || '');

    return actionResult(void 0);
  };
};

export const getLogDisableEventHistoryActionProcessor = createActionProcessor(askLogDisableEventHistory, getProcessLogDisableEventHistory);
