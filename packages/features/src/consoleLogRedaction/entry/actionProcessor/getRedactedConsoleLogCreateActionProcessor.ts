import { actionResult, askLogCreate, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { redactLogValue } from '../../logic/redactLogValue';

type RedactedConsoleLogCreate = { msg: string; data?: unknown };

const getProcessRedactedConsoleLogCreate = (qpqConfig: QPQConfig): ProcessorFor<typeof askLogCreate> => {
  return async ({ msg, logLevel, data }) => {
    // Redacted together so a value found in one is swept from the other too.
    const redacted = redactLogValue({ msg, data }) as RedactedConsoleLogCreate;
    const message = `${logLevel}: ${redacted.msg}`;

    // Presence check, not truthiness: falsy payloads like 0 or false still get logged.
    if (redacted.data !== undefined) {
      console.log(message, redacted.data);
    } else {
      console.log(message);
    }

    return actionResult(void 0);
  };
};

/** Replaces the default askLog console echo with one that redacts the message and data first. */
export const getRedactedConsoleLogCreateActionProcessor = createActionProcessor(askLogCreate, getProcessRedactedConsoleLogCreate);
