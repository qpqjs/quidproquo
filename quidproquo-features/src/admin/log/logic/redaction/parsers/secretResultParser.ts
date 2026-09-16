import { isErroredActionResult } from 'quidproquo-core';

import { collectStrings } from '../collectStrings';
import { REDACTION_SECRET_RESULT_ACTION_TYPES } from '../constants/REDACTION_SECRET_RESULT_ACTION_TYPES';
import { redactAllStrings } from '../redactAllStrings';
import { LogRedactionParser } from '../types/LogRedactionParser';

/**
 * The result of a secret-producing action (a config secret read, a decrypt) is redacted wholesale
 * and every string in it is reported for the sweep. A history entry's `res` is an [value, error]
 * tuple; only the value slot is touched, so error text stays readable.
 */
export const secretResultParser: LogRedactionParser = (log) => {
  const redactions: string[] = [];

  const redactedLog = {
    ...log,
    history: log.history.map((entry) => {
      if (!REDACTION_SECRET_RESULT_ACTION_TYPES.includes(entry.act.type) || isErroredActionResult(entry.res)) {
        return entry;
      }

      const [value, error] = entry.res;
      redactions.push(...collectStrings(value));
      return { ...entry, res: [redactAllStrings(value), error] };
    }),
  };

  return { redactedLog, redactions };
};
