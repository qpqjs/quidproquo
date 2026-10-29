import { AuthenticateUserChallenge } from './AuthenticateUserChallenge';
import { AuthenticationInfo } from './AuthenticationInfo';

export type AuthenticateUserResponse = {
  challenge: AuthenticateUserChallenge;
  challengeParameters?: Record<string, string>;
  session?: string;

  authenticationInfo?: AuthenticationInfo;
};
