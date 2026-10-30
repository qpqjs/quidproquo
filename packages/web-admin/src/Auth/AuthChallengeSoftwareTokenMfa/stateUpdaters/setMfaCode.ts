import { AuthChallengeMfaState } from '../types/AuthChallengeMfaState';

export const setMfaCode = (state: AuthChallengeMfaState, mfaCode: string): AuthChallengeMfaState => ({ ...state, mfaCode });
