import { AuthChallengeMfaSetupState } from '../types/AuthChallengeMfaSetupState';

export const createInitialAuthChallengeMfaSetupState = (): AuthChallengeMfaSetupState => ({
  secretCode: '',
  session: '',
  mfaCode: '',
});
