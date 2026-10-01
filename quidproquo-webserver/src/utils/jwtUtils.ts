/**
 * Base64url-decodes a JWT's payload WITHOUT verifying its signature. Never use for authorization.
 *
 * Returns null, quietly, for anything that isn't a JWT carrying a JSON object payload: callers use
 * this to peek at whatever bearer token a request sent, and many are legitimately not JWTs (opaque
 * session tokens, API keys), so a miss is normal, not an error worth logging.
 */
export function unsafeDecodeJWTPayload<T>(token: string | null | undefined): T | null {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }

  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    return payload !== null && typeof payload === 'object' && !Array.isArray(payload) ? (payload as T) : null;
  } catch {
    return null;
  }
}
