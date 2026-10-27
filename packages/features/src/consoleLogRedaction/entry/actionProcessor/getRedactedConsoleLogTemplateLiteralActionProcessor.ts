import {
  actionResult,
  askLogTemplateLiteral,
  createActionProcessor,
  DecomposedString,
  decomposedStringToString,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { redactLogValue } from '../../logic/redactLogValue';

const getProcessRedactedConsoleLogTemplateLiteral = (qpqConfig: QPQConfig): ProcessorFor<typeof askLogTemplateLiteral> => {
  return async ({ messageParts }) => {
    // Redacted before composing, while the interpolated values still carry their property names.
    const redactedParts = redactLogValue(messageParts) as DecomposedString;

    console.log(decomposedStringToString(redactedParts));

    return actionResult(void 0);
  };
};

/** Replaces the default template-literal askLog console echo with one that redacts the parts first. */
export const getRedactedConsoleLogTemplateLiteralActionProcessor = createActionProcessor(
  askLogTemplateLiteral,
  getProcessRedactedConsoleLogTemplateLiteral,
);
