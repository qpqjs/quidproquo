import { Effect } from '@qpqjs/core';

import { AuthChallengeMfaEffect } from './AuthChallengeMfaEffect';

export type AuthChallengeSetMfaCodeEffect = Effect<AuthChallengeMfaEffect.SetMfaCode, string>;
