import { AuthChallengeMfaState } from '../types/AuthChallengeMfaState';

export const createInitialAuthChallengeMfaState = (): AuthChallengeMfaState => ({
  mfaCode: '',
});
