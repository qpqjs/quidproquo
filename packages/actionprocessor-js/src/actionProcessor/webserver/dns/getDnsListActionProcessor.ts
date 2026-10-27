import { actionResult, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';
import { askDnsList, qpqWebServerUtils } from 'quidproquo-webserver';

const getProcessDnsList = (qpqConfig: QPQConfig): ProcessorFor<typeof askDnsList> => {
  return async () => actionResult(qpqWebServerUtils.getRootDomains(qpqConfig));
};

export const getDnsListActionProcessor = createActionProcessor(askDnsList, getProcessDnsList);
