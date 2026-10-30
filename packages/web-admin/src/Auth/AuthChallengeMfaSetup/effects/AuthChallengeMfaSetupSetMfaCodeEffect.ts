import { Effect } from '@qpqjs/core';

import { AuthChallengeMfaSetupEffect } from './AuthChallengeMfaSetupEffect';

export type AuthChallengeMfaSetupSetMfaCodeEffect = Effect<AuthChallengeMfaSetupEffect.SetMfaCode, string>;
