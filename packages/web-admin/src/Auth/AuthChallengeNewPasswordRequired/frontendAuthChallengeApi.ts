import { askAuthChallengeSetPasswordA } from './actionCreators/askAuthChallengeSetPasswordA';
import { askAuthChallengeSetPasswordB } from './actionCreators/askAuthChallengeSetPasswordB';
import { askAuthChallengeSendPasswords } from './logic/askAuthChallengeSendPasswords';

/** The challenge area's api surface; composes only. */
export const frontendAuthChallengeApi = {
  askAuthChallengeSetPasswordA,
  askAuthChallengeSetPasswordB,

  askAuthChallengeSendPasswords,
};
