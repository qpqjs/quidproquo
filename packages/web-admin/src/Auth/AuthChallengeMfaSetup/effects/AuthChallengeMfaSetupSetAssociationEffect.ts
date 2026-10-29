import { Effect } from '@qpqjs/core';

import { AuthChallengeMfaSetupEffect } from './AuthChallengeMfaSetupEffect';

export type AuthChallengeMfaSetupSetAssociationEffect = Effect<AuthChallengeMfaSetupEffect.SetAssociation, { secretCode: string; session: string }>;
