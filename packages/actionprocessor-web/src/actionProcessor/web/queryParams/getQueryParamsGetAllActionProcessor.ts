import { actionResult, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';
import { askQueryParamsGetAll, QueryParamsActionType } from 'quidproquo-web';

const getProcessQueryParamsGetAll = (qpqConfig: QPQConfig): ProcessorFor<typeof askQueryParamsGetAll> => {
  return async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const paramsObject: Record<string, string[]> = {};

    urlParams.forEach((value, key) => {
      // Keys come from the url. `__proto__` cannot be an own entry of a plain object (assigning
      // it swaps the prototype), so it is dropped; any other inherited name (`toString`,
      // `constructor`) is shadowed as an own entry rather than read off Object.prototype.
      if (key === '__proto__') {
        return;
      }
      const existing = Object.prototype.hasOwnProperty.call(paramsObject, key) ? paramsObject[key] : [];
      paramsObject[key] = [...existing, value];
    });

    return actionResult(paramsObject);
  };
};

export const getQueryParamsGetAllActionProcessor = createActionProcessor(askQueryParamsGetAll, getProcessQueryParamsGetAll);
