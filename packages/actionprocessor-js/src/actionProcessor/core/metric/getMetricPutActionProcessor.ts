import { actionResult, askMetricPut, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

// Dev-visible stand-in for the AWS EMF processor - keeps stories portable across runtimes
const getProcessMetricPut = (qpqConfig: QPQConfig): ProcessorFor<typeof askMetricPut> => {
  return async ({ metricName, value, unit }) => {
    console.log(`metric: ${metricName}=${value}${unit ? ` ${unit}` : ''}`);

    return actionResult(void 0);
  };
};

export const getMetricPutActionProcessor = createActionProcessor(askMetricPut, getProcessMetricPut);
