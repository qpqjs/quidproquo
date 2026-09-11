import { askCryptoVerify } from '../../actions';
import { AskResponse } from '../../types';
import { base64UrlDecodeUtf8, isBase64Url } from '../../utils';
import { askGetCurrentEpoch } from '../dateTime';

export type JwtVerifyFailureReason =
  | 'malformed' // not three base64url segments, or header/payload is not JSON
  | 'unsupported-algorithm' // header alg is not RS256
  | 'bad-signature' // signature does not verify under the key
  | 'not-yet-valid' // nbf is in the future
  | 'expired'; // exp is in the past

export type JwtVerifyResult<T> = { valid: true; claims: T } | { valid: false; reason: JwtVerifyFailureReason };

type JwtTimeClaims = { exp?: unknown; nbf?: unknown };

const parseJson = (segment: string): unknown => {
  const decoded = base64UrlDecodeUtf8(segment);
  if (decoded === null) {
    return undefined;
  }

  try {
    return JSON.parse(decoded);
  } catch {
    return undefined;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

// Verifies a compact JWT produced by askCryptoSignJwt (or any RS256 signer whose
// public key is the signing key's) and returns its claims. Untrusted input never
// throws: every way a token can be bad is a `valid: false` result with a reason,
// so a route can map it to 401 without a try/catch. Only the signature and the
// standard `exp`/`nbf` time claims are checked (against QPQ time, so the check is
// deterministic); audience, issuer and anything app-specific are the caller's.
export function* askCryptoVerifyJwt<T extends object>(keyName: string, token: string): AskResponse<JwtVerifyResult<T>> {
  const segments = token.split('.');
  if (segments.length !== 3 || !segments.every(isBase64Url)) {
    return { valid: false, reason: 'malformed' };
  }

  const [headerSegment, payloadSegment, signature] = segments;

  const header = parseJson(headerSegment);
  if (!isRecord(header)) {
    return { valid: false, reason: 'malformed' };
  }

  if (header.alg !== 'RS256') {
    return { valid: false, reason: 'unsupported-algorithm' };
  }

  // Signature before payload: nothing in an unverified payload is trusted, not
  // even enough to decide whether it parses.
  const signatureIsValid = yield* askCryptoVerify(keyName, `${headerSegment}.${payloadSegment}`, signature);
  if (!signatureIsValid) {
    return { valid: false, reason: 'bad-signature' };
  }

  const claims = parseJson(payloadSegment);
  if (!isRecord(claims)) {
    return { valid: false, reason: 'malformed' };
  }

  const { exp, nbf } = claims as JwtTimeClaims;

  if (exp !== undefined || nbf !== undefined) {
    const now = yield* askGetCurrentEpoch();

    if (typeof nbf === 'number' && now < nbf) {
      return { valid: false, reason: 'not-yet-valid' };
    }

    if (typeof exp === 'number' && now >= exp) {
      return { valid: false, reason: 'expired' };
    }
  }

  return { valid: true, claims: claims as T };
}
