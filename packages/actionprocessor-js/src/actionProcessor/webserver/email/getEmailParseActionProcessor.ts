import { actionResult, actionResultError, actionResultErrorFromCaughtError, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';
import { askEmailParse } from '@qpqjs/webserver';

import { parseEmailMessage } from './utils';

const getProcessEmailParse = (qpqConfig: QPQConfig): ProcessorFor<typeof askEmailParse> => {
  return async ({ rawBase64 }) => {
    try {
      return actionResult(await parseEmailMessage(Buffer.from(rawBase64, 'base64')));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        Error: (caught) => actionResultError(askEmailParse.errorType.Invalid, `Not a MIME message: ${caught.message}`),
      });
    }
  };
};

export const getEmailParseActionProcessor = createActionProcessor(askEmailParse, getProcessEmailParse);
