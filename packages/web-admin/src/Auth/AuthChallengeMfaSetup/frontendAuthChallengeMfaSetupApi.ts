import { askAuthChallengeSetMfaSetupCode } from './actionCreators/askAuthChallengeSetMfaSetupCode';
import { askAuthChallengeAssociateSoftwareToken } from './logic/askAuthChallengeAssociateSoftwareToken';
import { askAuthChallengeSendMfaSetupCode } from './logic/askAuthChallengeSendMfaSetupCode';

/** The challenge area's api surface; composes only. */
export const frontendAuthChallengeMfaSetupApi = {
  askAuthChallengeSetMfaSetupCode,

  askAuthChallengeAssociateSoftwareToken,
  askAuthChallengeSendMfaSetupCode,
};
