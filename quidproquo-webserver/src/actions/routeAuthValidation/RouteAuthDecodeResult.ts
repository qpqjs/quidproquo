import { DecodedAccessToken } from 'quidproquo-core';

import { RouteAuthDecodeOutcome } from './RouteAuthDecodeOutcome';

// The tri-state result of the route auth decode action. The outcomes are
// explicit (no null overloading) because "no token auth configured" and
// "token auth failed" must never be conflated: the first passes as anonymous,
// the second is a 401.
export type RouteAuthDecodeResult =
  | { outcome: RouteAuthDecodeOutcome.notApplicable }
  | { outcome: RouteAuthDecodeOutcome.valid; decodedAccessToken: DecodedAccessToken }
  | { outcome: RouteAuthDecodeOutcome.invalid };
