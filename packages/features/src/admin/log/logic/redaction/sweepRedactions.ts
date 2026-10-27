import { REDACTED_STRING } from './constants/REDACTED_STRING';
import { REDACTION_MIN_SWEEP_LENGTH } from './constants/REDACTION_MIN_SWEEP_LENGTH';
import { mapEncodedJson } from './mapEncodedJson';
import { mapStrings } from './mapStrings';

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Replaces every occurrence of each value, as a substring, in every string leaf of the tree, and
 * inside any string leaf that holds encoded JSON. Longest values go first so a secret that
 * contains another leaves no fragment behind.
 */
export const sweepRedactions = <T>(value: T, redactions: string[]): T => {
  const values = [...new Set(redactions)].filter((r) => r.length >= REDACTION_MIN_SWEEP_LENGTH).sort((a, b) => b.length - a.length);

  if (values.length === 0) {
    return value;
  }

  const pattern = new RegExp(values.map(escapeRegExp).join('|'), 'g');
  const replaceInText = (text: string): string => text.replace(pattern, REDACTED_STRING);
  const replaceInContainer = (container: unknown): unknown => mapStrings(container, replaceInText);

  return mapEncodedJson(value, replaceInContainer, replaceInText);
};
