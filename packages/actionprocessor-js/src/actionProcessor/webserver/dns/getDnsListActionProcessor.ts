import { actionResult, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';
import { askDnsList, qpqWebServerUtils } from '@qpqjs/webserver';

const getProcessDnsList = (qpqConfig: QPQConfig): ProcessorFor<typeof askDnsList> => {
  return async () => actionResult(qpqWebServerUtils.getRootDomains(qpqConfig));
};

export const getDnsListActionProcessor = createActionProcessor(askDnsList, getProcessDnsList);
