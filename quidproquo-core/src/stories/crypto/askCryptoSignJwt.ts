import { askCryptoSign } from '../../actions';
import { AskResponse } from '../../types';
import { base64UrlEncodeUtf8 } from '../../utils';

const JWT_HEADER = base64UrlEncodeUtf8(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));

// Mints a compact RS256 JWT over `claims` with a signing key. Every time-based
// claim (`exp`, `nbf`, `iat`) must already be on `claims`, sourced from QPQ
// time, so signing stays deterministic: the same key + claims always yields the
// same token. Pair with askCryptoVerifyJwt.
export function* askCryptoSignJwt(keyName: string, claims: object): AskResponse<string> {
  const signingInput = `${JWT_HEADER}.${base64UrlEncodeUtf8(JSON.stringify(claims))}`;

  const signature = yield* askCryptoSign(keyName, signingInput);

  return `${signingInput}.${signature}`;
}
