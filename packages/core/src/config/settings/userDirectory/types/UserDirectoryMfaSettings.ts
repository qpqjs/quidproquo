import { UserDirectoryMfaMode } from './UserDirectoryMfaMode';
import { UserDirectoryMfaSecondFactor } from './UserDirectoryMfaSecondFactor';

export type UserDirectoryMfaSettings = {
  mode: UserDirectoryMfaMode;

  // Enabled second factors. Defaults to [totp] when omitted.
  secondFactors?: UserDirectoryMfaSecondFactor[];
};
