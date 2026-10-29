import {
  AuthenticateUserCustomChallengeChallenge,
  AuthenticateUserMfaSetupChallenge,
  AuthenticateUserNewPasswordRequiredChallenge,
  AuthenticateUserSoftwareTokenMfaChallenge,
} from './authChallenges';

export type AnyAuthChallenge =
  | AuthenticateUserNewPasswordRequiredChallenge
  | AuthenticateUserCustomChallengeChallenge<any>
  | AuthenticateUserSoftwareTokenMfaChallenge
  | AuthenticateUserMfaSetupChallenge;
