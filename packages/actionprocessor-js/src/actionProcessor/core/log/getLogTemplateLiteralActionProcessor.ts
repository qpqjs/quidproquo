import { actionResult, askLogTemplateLiteral, createActionProcessor, decomposedStringToString, ProcessorFor, QPQConfig } from 'quidproquo-core';

const getProcessLogTemplateLiteral = (qpqConfig: QPQConfig): ProcessorFor<typeof askLogTemplateLiteral> => {
  return async ({ messageParts }) => {
    const message = decomposedStringToString(messageParts);

    console.log(message);

    return actionResult(void 0);
  };
};

export const getLogTemplateLiteralActionProcessor = createActionProcessor(askLogTemplateLiteral, getProcessLogTemplateLiteral);
