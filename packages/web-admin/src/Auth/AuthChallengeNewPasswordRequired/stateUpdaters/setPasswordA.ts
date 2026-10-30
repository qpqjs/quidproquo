import { AuthChallengeState } from '../types/AuthChallengeState';

export const setPasswordA = (state: AuthChallengeState, password: string): AuthChallengeState => ({ ...state, passwordA: password });
