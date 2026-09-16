import { collectStrings } from '../collectStrings';
import { REDACTED_STRING } from '../constants/REDACTED_STRING';
import { REDACTION_FIELD_ONLY_KEYS } from '../constants/REDACTION_FIELD_ONLY_KEYS';
import { REDACTION_IGNORED_KEYS } from '../constants/REDACTION_IGNORED_KEYS';
import { REDACTION_SWEEP_KEYS } from '../constants/REDACTION_SWEEP_KEYS';
import { mapKeyedValues } from '../mapKeyedValues';
import { redactAllStrings } from '../redactAllStrings';
import { LogRedactionParser } from '../types/LogRedactionParser';

/**
 * Redacts the value under every known sensitive property name, at any depth. Values under
 * sweep keys are also reported for the final sweep; values under field-only keys are not.
 * A non-string value (an object holding the secret, say) is redacted wholesale.
 */
export const knownKeysParser: LogRedactionParser = (log) => {
  const redactions: string[] = [];

  const collectAndRedact = (entry: unknown): unknown => {
    redactions.push(...collectStrings(entry));
    return typeof entry === 'string' ? REDACTED_STRING : redactAllStrings(entry);
  };

  const redactOnly = (entry: unknown): unknown => (typeof entry === 'string' ? REDACTED_STRING : redactAllStrings(entry));

  const sweptLog = mapKeyedValues(log, REDACTION_SWEEP_KEYS, REDACTION_IGNORED_KEYS, collectAndRedact);
  const redactedLog = mapKeyedValues(sweptLog, REDACTION_FIELD_ONLY_KEYS, REDACTION_IGNORED_KEYS, redactOnly);

  return { redactedLog, redactions };
};
