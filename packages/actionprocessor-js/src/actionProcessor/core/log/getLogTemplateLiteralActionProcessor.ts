import { actionResult, askLog, createActionProcessor, decomposedStringToString, ProcessorFor, QPQConfig } from '@qpqjs/core';

const getProcessLogTemplateLiteral = (qpqConfig: QPQConfig): ProcessorFor<typeof askLog> => {
  return async ({ messageParts }) => {
    const message = decomposedStringToString(messageParts);

    console.log(message);

    return actionResult(undefined);
  };
};

export const getLogTemplateLiteralActionProcessor = createActionProcessor(askLog, getProcessLogTemplateLiteral);
