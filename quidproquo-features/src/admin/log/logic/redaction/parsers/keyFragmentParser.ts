import { collectStrings } from '../collectStrings';
import { REDACTED_STRING } from '../constants/REDACTED_STRING';
import { REDACTION_IGNORED_KEYS } from '../constants/REDACTION_IGNORED_KEYS';
import { REDACTION_SWEEP_KEY_FRAGMENTS } from '../constants/REDACTION_SWEEP_KEY_FRAGMENTS';
import { mapEncodedJson } from '../mapEncodedJson';
import { mapMatchingKeyedValues } from '../mapMatchingKeyedValues';
import { redactAllStrings } from '../redactAllStrings';
import { LogRedactionParser } from '../types/LogRedactionParser';

const matchesFragment = (lowerKey: string): boolean => REDACTION_SWEEP_KEY_FRAGMENTS.some((fragment) => lowerKey.includes(fragment));

/**
 * Redacts the value under every property whose name contains a sensitive fragment (e.g. "secret"),
 * at any depth, including inside string leaves that hold encoded JSON or a form body (so
 * `client_secret=...` in a token request is caught), and reports every string it redacted for the
 * final sweep. A non-string value (an object holding the secret, say) is redacted wholesale.
 */
export const keyFragmentParser: LogRedactionParser = (log) => {
  const redactions: string[] = [];

  const collectAndRedact = (entry: unknown): unknown => {
    redactions.push(...collectStrings(entry));
    return typeof entry === 'string' ? REDACTED_STRING : redactAllStrings(entry);
  };

  const redactKeys = <T>(value: T): T => mapMatchingKeyedValues(value, matchesFragment, REDACTION_IGNORED_KEYS, collectAndRedact);

  const redactedLog = mapEncodedJson(redactKeys(log), redactKeys);

  return { redactedLog, redactions };
};
