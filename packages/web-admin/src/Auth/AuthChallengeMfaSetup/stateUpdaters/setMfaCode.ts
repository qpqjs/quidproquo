import { AuthChallengeMfaSetupState } from '../types/AuthChallengeMfaSetupState';

export const setMfaCode = (state: AuthChallengeMfaSetupState, mfaCode: string): AuthChallengeMfaSetupState => ({ ...state, mfaCode });
