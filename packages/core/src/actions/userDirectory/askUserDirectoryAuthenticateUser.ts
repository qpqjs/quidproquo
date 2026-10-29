import { createActionRequester } from '../../logic/actions/createActionRequester';
import { AskResponse } from '../../types/StorySession';
import { askThrowError } from '../error/askThrowError';
import { AuthenticateUserResponse, UserDirectoryActionType } from './UserDirectoryActionType';

export type AuthenticateUserRequest = {
  email: string;
} & (
  | {
      [key: string]: any;
      isCustom: true;
    }
  | {
      password: string;
      isCustom: false;
    }
);

export const askUserDirectoryAuthenticateUserBase = createActionRequester<AuthenticateUserResponse>()({
  actionType: UserDirectoryActionType.AuthenticateUser,
  errorTypes: [
    'UserNotFound', // no user with that username or email in the directory
    'InvalidPassword', // the password does not match
  ],
  getPayload: (userDirectoryName: string, authenticateUserRequest: AuthenticateUserRequest) => ({ userDirectoryName, authenticateUserRequest }),
});

export function* askUserDirectoryAuthenticateUser(
  userDirectoryName: string,
  isCustom: boolean,
  email: string,
  password?: string,
): AskResponse<AuthenticateUserResponse> {
  // A standard sign-in without a password can never succeed. Fail fast here so a
  // missing password is a typed error rather than an undefined value handed to the
  // identity provider (the dev-server processor would otherwise accept it).
  if (!isCustom && !password) {
    return yield* askThrowError<AuthenticateUserResponse>(askUserDirectoryAuthenticateUserBase.errorType.InvalidPassword, 'Password required');
  }

  const authenticateUserRequest: AuthenticateUserRequest = isCustom
    ? {
        isCustom: true,
        email: email,
      }
    : {
        isCustom: false,
        email,
        password: password!,
      };

  return yield* askUserDirectoryAuthenticateUserBase(userDirectoryName, authenticateUserRequest);
}
