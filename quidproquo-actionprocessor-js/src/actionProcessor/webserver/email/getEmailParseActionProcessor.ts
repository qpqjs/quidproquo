import { actionResult, actionResultError, actionResultErrorFromCaughtError, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';
import { askEmailParse } from 'quidproquo-webserver';

import { parseEmailMessage } from './parseEmailMessage';

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
