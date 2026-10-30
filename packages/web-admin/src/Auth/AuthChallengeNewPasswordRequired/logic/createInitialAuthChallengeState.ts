import { AuthChallengeState } from '../types/AuthChallengeState';

export const createInitialAuthChallengeState = (): AuthChallengeState => ({
  passwordA: '',
  passwordB: '',
});
