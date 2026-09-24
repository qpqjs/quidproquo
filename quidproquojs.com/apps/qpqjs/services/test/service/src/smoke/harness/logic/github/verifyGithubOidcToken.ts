import { Nullable } from 'quidproquo';

import { createPublicKey, JsonWebKey as NodeJsonWebKey } from 'crypto';
import jwt from 'jsonwebtoken';

import {
  GITHUB_OIDC_AUDIENCE,
  GITHUB_OIDC_ISSUER,
  GITHUB_OIDC_JWKS_URL,
  GITHUB_REPOSITORY_ID,
} from '../../constants/githubOidc';
import { GithubOidcClaims } from '../../models/GithubOidcClaims';

type JwksKey = { kid: string } & Record<string, unknown>;

// This runs inside an action processor (host code, not a story), so direct
// fetch and wall-clock time are fine here; determinism rules apply to stories.
let cachedJwksKeys: Nullable<JwksKey[]> = null;
let cachedJwksFetchedAt = 0;
const JWKS_CACHE_TTL_MS = 10 * 60 * 1000;

const getJwksKeys = async (): Promise<JwksKey[]> => {
  const cacheIsFresh =
    cachedJwksKeys && Date.now() - cachedJwksFetchedAt < JWKS_CACHE_TTL_MS;
  if (cachedJwksKeys && cacheIsFresh) {
    return cachedJwksKeys;
  }

  const response = await fetch(GITHUB_OIDC_JWKS_URL);
  if (!response.ok) {
    throw new Error(`JWKS fetch failed with status ${response.status}`);
  }

  const jwks = (await response.json()) as { keys: JwksKey[] };
  cachedJwksKeys = jwks.keys;
  cachedJwksFetchedAt = Date.now();

  return jwks.keys;
};

// The kid of a rotated-in signing key will not be in a cached JWKS; one forced
// refetch covers rotation without a failed request in between.
const getJwksKeyByKid = async (kid: string): Promise<Nullable<JwksKey>> => {
  const keys = await getJwksKeys();
  const key = keys.find((k) => k.kid === kid);
  if (key) {
    return key;
  }

  cachedJwksKeys = null;
  const refreshedKeys = await getJwksKeys();
  return refreshedKeys.find((k) => k.kid === kid) || null;
};

// Verifies a GitHub Actions OIDC token and pins it to this repo and the given
// environment. Returns the claims when everything holds, null otherwise; the
// caller never learns why a token failed (nor does the response).
export const verifyGithubOidcToken = async (
  token: string,
  expectedEnvironment: string
): Promise<Nullable<GithubOidcClaims>> => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
      return null;
    }

    const jwksKey = await getJwksKeyByKid(decoded.header.kid);
    if (!jwksKey) {
      return null;
    }

    const publicKey = createPublicKey({
      key: jwksKey as NodeJsonWebKey,
      format: 'jwk',
    });

    // Signature, issuer, audience and exp are all enforced here; a failure throws.
    const claims = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: GITHUB_OIDC_ISSUER,
      audience: GITHUB_OIDC_AUDIENCE,
    }) as Partial<GithubOidcClaims>;

    // Pin the immutable repository id, never the name, and the environment the
    // workflow job ran under (jobs must declare `environment: <env>`).
    if (claims.repository_id !== GITHUB_REPOSITORY_ID) {
      return null;
    }
    if (claims.environment !== expectedEnvironment) {
      return null;
    }

    return {
      sub: claims.sub || '',
      repository: claims.repository || '',
      repository_id: claims.repository_id,
      environment: claims.environment,
      run_id: claims.run_id || '',
      exp: claims.exp || 0,
    };
  } catch {
    return null;
  }
};
