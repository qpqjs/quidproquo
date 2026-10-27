import { createActionRequester } from '../../types';
import { AnyAuthChallenge } from './types';
import { AuthenticateUserResponse, UserDirectoryActionType } from './UserDirectoryActionType';

export const askUserDirectoryRespondToAuthChallenge = createActionRequester<AuthenticateUserResponse>()({
  actionType: UserDirectoryActionType.RespondToAuthChallenge,
  errorTypes: [
    'InvalidCode', // the supplied MFA / challenge / TOTP code is incorrect
    'ExpiredCode', // the supplied code has expired; the caller should restart the challenge
    'InvalidNewPassword', // (NEW_PASSWORD_REQUIRED) the proposed password does not meet the user pool password policy
    'Unauthorized', // the challenge session is invalid or has expired; the caller must restart authentication
    'LimitExceeded', // too many attempts; the caller should back off and retry later
  ],
  getPayload: (userDirectoryName: string, authChallenge: AnyAuthChallenge) => ({ userDirectoryName, authChallenge }),
});
