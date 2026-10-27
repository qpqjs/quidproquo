import { REDACTED_STRING } from './constants/REDACTED_STRING';
import { mapStrings } from './mapStrings';

/** Deep-copies a value with every string leaf replaced by the redaction marker. */
export const redactAllStrings = <T>(value: T): T => mapStrings(value, () => REDACTED_STRING);
