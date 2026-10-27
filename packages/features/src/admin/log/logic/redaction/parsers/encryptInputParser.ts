import { CryptoActionType } from 'quidproquo-core';

import { collectStrings } from '../collectStrings';
import { redactAllStrings } from '../redactAllStrings';
import { LogRedactionParser } from '../types/LogRedactionParser';

/**
 * Anything handed to an encrypt action is a secret by definition: the whole payload is redacted and
 * every string in it is reported for the sweep. The ciphertext result is left alone.
 */
export const encryptInputParser: LogRedactionParser = (log) => {
  const redactions: string[] = [];

  const redactedLog = {
    ...log,
    history: log.history.map((entry) => {
      if (entry.act.type !== CryptoActionType.Encrypt) {
        return entry;
      }

      redactions.push(...collectStrings(entry.act.payload));
      return { ...entry, act: { ...entry.act, payload: redactAllStrings(entry.act.payload) } };
    }),
  };

  return { redactedLog, redactions };
};
