import { base64Codec } from '../codecs/base64Codec';
import { collectStrings } from '../collectStrings';
import { LogRedactionParser } from '../types/LogRedactionParser';

// RFC 7617: the scheme is case-insensitive and the credentials are standard base64 of `user:password`.
const basicAuthPattern = /\bBasic\s+([A-Za-z0-9+/]+={0,2})/gi;

// The encoded credentials, the decoded `user:password`, and the password alone. Nothing for text that
// only looks like Basic auth ("Basic plan"): it must decode strictly and hold a colon.
const basicAuthRedactions = (encoded: string): string[] => {
  const decoded = base64Codec.decode(encoded);
  const separator = decoded?.indexOf(':') ?? -1;
  if (!decoded || separator < 0) {
    return [];
  }

  return [encoded, decoded, decoded.slice(separator + 1)];
};

/**
 * Detector only: reports every `Basic` credential found anywhere in the log, so the sweep removes the
 * password even where code decoded the header and passed it on. The user part stays visible: it names
 * who called and is not a secret. Must run before knownKeysParser, which blanks the header it reads.
 */
export const basicAuthParser: LogRedactionParser = (log) => {
  const redactions = collectStrings(log).flatMap((text) =>
    [...text.matchAll(basicAuthPattern)].flatMap(([, encoded = '']) => basicAuthRedactions(encoded)),
  );

  return { redactedLog: log, redactions };
};
