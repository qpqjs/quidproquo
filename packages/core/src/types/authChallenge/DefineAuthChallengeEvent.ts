import { UserAttributes } from '../../actions';
import { ChallengeSession } from './types';

export type DefineAuthChallengeEvent = {
  userName: string;
  session: ChallengeSession;
  userAttributes: UserAttributes;
};

export type DefineAuthChallengeEventResponse = {
  runCreateAuthChallenge: boolean;
  failAuthentication: boolean;
  issueTokens: boolean;
};
