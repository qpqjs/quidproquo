// The GitHub Actions OIDC claims the smoke endpoint pins on. Everything else
// in the token is ignored on purpose: repository_id and environment are the
// trust anchors, sub/repository/run_id only feed the session identity for logs.
export type GithubOidcClaims = {
  sub: string;
  repository: string;
  repository_id: string;
  environment: string;
  run_id: string;
  exp: number;
};
