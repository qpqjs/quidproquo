import { askAuthChallengeSetPasswordA, askAuthChallengeSetPasswordB } from '../authActionCreator';
import { askAuthChallengeSendPasswords } from './askAuthChallengeSendPasswords';

export const authChallengeLogic = {
  askAuthChallengeSetPasswordA,
  askAuthChallengeSetPasswordB,

  askAuthChallengeSendPasswords,
};
