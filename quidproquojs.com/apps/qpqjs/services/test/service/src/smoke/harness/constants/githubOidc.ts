// The pinned claims for GitHub Actions OIDC tokens accepted by the smoke
// endpoint. All public, none secret.

// The only issuer GitHub Actions OIDC tokens can come from.
export const GITHUB_OIDC_ISSUER = 'https://token.actions.githubusercontent.com';

// Where GitHub publishes the signing keys for its Actions OIDC tokens.
export const GITHUB_OIDC_JWKS_URL =
  'https://token.actions.githubusercontent.com/.well-known/jwks';

// Dedicated audience the deployed-smoke workflow job requests its token with.
// Tokens minted for any other purpose (e.g. the AWS deploy role) carry a
// different audience and are rejected.
export const GITHUB_OIDC_AUDIENCE = 'qpq-smoke';

// The immutable GitHub id of qpqjs/quidproquo, fetched once with
// `gh api repos/qpqjs/quidproquo --jq .id`. Pinned instead of the repo NAME
// because names can be reassigned; ids cannot.
export const GITHUB_REPOSITORY_ID = '571382961';
