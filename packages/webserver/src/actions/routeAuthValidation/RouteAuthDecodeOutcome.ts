export enum RouteAuthDecodeOutcome {
  // No token auth is configured for the route: the request passes with an
  // anonymous session.
  notApplicable = 'notApplicable',

  // The token decoded and validated: the request passes and the decoded token
  // is seeded onto the story session.
  valid = 'valid',

  // Token auth applies and the request did not satisfy it: 401.
  invalid = 'invalid',
}
