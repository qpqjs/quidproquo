import { askAuthChallengeSetMfaCode } from './actionCreators/askAuthChallengeSetMfaCode';
import { askAuthChallengeSendMfaCode } from './logic/askAuthChallengeSendMfaCode';

/** The challenge area's api surface; composes only. */
export const frontendAuthChallengeMfaApi = {
  askAuthChallengeSetMfaCode,

  askAuthChallengeSendMfaCode,
};
