import { actionResult, askLog, createActionProcessor, DecomposedStringPrimitive, ProcessorFor, QPQConfig } from '@qpqjs/core';

import chalk from 'chalk';

const getProcessLogTemplateLiteral = (qpqConfig: QPQConfig): ProcessorFor<typeof askLog> => {
  return async ({ messageParts: [strings, values] }) => {
    const message = values.reduce(
      (str: string, value: DecomposedStringPrimitive, index: number) => str + chalk.yellowBright(String(value)) + chalk.white(strings[index + 1]),
      chalk.white(strings[0]),
    );

    console.log(message);

    return actionResult(undefined);
  };
};

export const getLogTemplateLiteralActionProcessor = createActionProcessor(askLog, getProcessLogTemplateLiteral);
