import { REDACTION_URL_FRAGMENT_MIN_LENGTH } from '../constants/REDACTION_URL_FRAGMENT_MIN_LENGTH';
import { mapEncodedJson } from '../mapEncodedJson';
import { LogRedactionParser } from '../types/LogRedactionParser';

// A URL with a fragment, up to the first character that ends a URL in text or markup.
const URL_WITH_FRAGMENT = /https?:\/\/[^\s"'<>#]*#([^\s"'<>]+)/g;
// A random-looking run in a fragment: the token itself, or each value in `#access_token=...&...`.
const TOKEN_RUN = new RegExp(`[A-Za-z0-9_-]{${REDACTION_URL_FRAGMENT_MIN_LENGTH},}`, 'g');
// A GUID on its own is an id (a record in an app route, say), not a secret.
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Reports, for the final sweep, every long random-looking value after a URL's `#`: where links carry
 * their secret (signing links, magic sign-in links, OAuth implicit-flow tokens), since the fragment
 * never reaches a server. Looks in every string of the log, including inside encoded JSON and form
 * bodies, so a link in an email's text or HTML is caught with no key name to go on. App routes
 * (`#/items/...`, from a hash router) and bare GUIDs are ids, not secrets, and are left alone. The
 * sweep then removes each value from every string in the log; the log itself is returned unchanged.
 */
export const urlFragmentParser: LogRedactionParser = (log) => {
  const redactions: string[] = [];

  const collectFromText = (text: string): string => {
    for (const [, fragment] of text.matchAll(URL_WITH_FRAGMENT)) {
      if (!fragment.startsWith('/')) {
        redactions.push(...(fragment.match(TOKEN_RUN) ?? []).filter((run) => !GUID.test(run)));
      }
    }
    return text;
  };

  mapEncodedJson(log, (container) => container, collectFromText);

  return { redactedLog: log, redactions };
};
