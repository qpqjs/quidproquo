import { AskResponse, Nullable } from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';
import { askSmokeFetchWebsiteIndex } from '../../../harness/logic/website/askSmokeFetchWebsiteIndex';

const header = (headers: Record<string, string>, name: string): Nullable<string> =>
  Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1] ?? null;

// `max-age=0` switches HSTS off, so a header that carries it must fail the probe.
const hasPositiveMaxAge = (value: string): boolean => {
  const maxAge = /max-age=(\d+)/i.exec(value)?.[1];
  return maxAge !== undefined && Number(maxAge) > 0;
};

// Checklist item: web entry security headers. Every web entry sends the baseline
// browser hardening headers whether or not the app configured any, so the site
// cannot be framed, sniffed or downgraded to http.
export function* askRunWebsiteSecurityHeadersTest(): AskResponse<void> {
  const { index } = yield* askSmokeFetchWebsiteIndex();

  const expected: [string, (value: string) => boolean][] = [
    ['strict-transport-security', hasPositiveMaxAge],
    ['x-content-type-options', (value) => /^nosniff$/i.test(value)],
    ['x-frame-options', (value) => /^DENY$/i.test(value)],
    ['referrer-policy', (value) => /strict-origin-when-cross-origin/.test(value)],
  ];
  for (const [name, isAcceptable] of expected) {
    const value = header(index.headers, name);
    yield* askSmokeAssert(!!value && isAcceptable(value), `website index is missing the ${name} header (got [${value ?? 'none'}])`);
  }
}
