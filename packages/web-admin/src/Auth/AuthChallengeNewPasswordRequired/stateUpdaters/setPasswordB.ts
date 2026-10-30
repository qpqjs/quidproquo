import { AuthChallengeState } from '../types/AuthChallengeState';

export const setPasswordB = (state: AuthChallengeState, password: string): AuthChallengeState => ({ ...state, passwordB: password });
