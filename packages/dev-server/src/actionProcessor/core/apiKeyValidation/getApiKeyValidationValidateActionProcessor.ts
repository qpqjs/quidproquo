import { actionResult, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';
import { askApiKeyValidationValidate } from '@qpqjs/webserver';

const getProcessApiKeyValidationValidate = (qpqConfig: QPQConfig): ProcessorFor<typeof askApiKeyValidationValidate> => {
  return async () => {
    // Permissive dev mode - always return true
    return actionResult(true);
  };
};

export const getApiKeyValidationValidateActionProcessor = createActionProcessor(askApiKeyValidationValidate, getProcessApiKeyValidationValidate);
