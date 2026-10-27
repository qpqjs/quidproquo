import { askAuthChallengeSetMfaSetupCode } from '../authActionCreator';
import { askAuthChallengeAssociateSoftwareToken } from './askAuthChallengeAssociateSoftwareToken';
import { askAuthChallengeSendMfaSetupCode } from './askAuthChallengeSendMfaSetupCode';

export const authChallengeMfaSetupLogic = {
  askAuthChallengeSetMfaSetupCode,

  askAuthChallengeAssociateSoftwareToken,
  askAuthChallengeSendMfaSetupCode,
};
