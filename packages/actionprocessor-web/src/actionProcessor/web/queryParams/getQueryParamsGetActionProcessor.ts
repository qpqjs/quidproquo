import { actionResult, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';
import { askQueryParamsGet, QueryParamsActionType } from 'quidproquo-web';

const getProcessQueryParamsGet = (qpqConfig: QPQConfig): ProcessorFor<typeof askQueryParamsGet> => {
  return async ({ key }) => {
    const urlParams = new URLSearchParams(window.location.search);
    const values = urlParams.getAll(key);

    return actionResult(values);
  };
};

export const getQueryParamsGetActionProcessor = createActionProcessor(askQueryParamsGet, getProcessQueryParamsGet);
