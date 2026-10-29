import { AuthChallengeMfaSetupState } from '../types/AuthChallengeMfaSetupState';

export const setAssociation = (
  state: AuthChallengeMfaSetupState,
  { secretCode, session }: { secretCode: string; session: string },
): AuthChallengeMfaSetupState => ({ ...state, secretCode, session });
