import { collectStrings } from '../collectStrings';
import { LogRedactionParser } from '../types/LogRedactionParser';

// Three base64url segments separated by dots. Header and payload must start with a JSON object
// ("eyJ" is base64 for `{"`), which keeps ordinary dotted identifiers out.
const jwtPattern = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

/** Detector only: reports every JWT found anywhere in the log for the sweep. Does not modify the log. */
export const jwtParser: LogRedactionParser = (log) => {
  const redactions = collectStrings(log).flatMap((text) => text.match(jwtPattern) ?? []);

  return { redactedLog: log, redactions };
};
