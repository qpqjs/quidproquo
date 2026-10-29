import { AuthChallengeMfaSetupSetAssociationEffect } from './AuthChallengeMfaSetupSetAssociationEffect';
import { AuthChallengeMfaSetupSetMfaCodeEffect } from './AuthChallengeMfaSetupSetMfaCodeEffect';

export type AuthChallengeMfaSetupEffects = AuthChallengeMfaSetupSetMfaCodeEffect | AuthChallengeMfaSetupSetAssociationEffect;
