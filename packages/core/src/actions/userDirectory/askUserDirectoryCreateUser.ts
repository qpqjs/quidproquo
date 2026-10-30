import { createActionRequester } from '../../logic/actions';
import { AuthenticateUserResponse, UserAttributes } from './types';
import { UserDirectoryActionType } from './UserDirectoryActionType';

export type CreateUserRequest = {
  email: string;
  emailVerified: boolean;
  password: string;
} & Omit<UserAttributes, 'userId'>;

export const askUserDirectoryCreateUser = createActionRequester<AuthenticateUserResponse>()({
  actionType: UserDirectoryActionType.CreateUser,
  errorTypes: [
    'Conflict', // an account with this email already exists
    'InvalidPassword', // the supplied password does not meet the user pool password policy
    'LimitExceeded', // too many create-user attempts; the caller should back off and retry later
  ],
  getPayload: (userDirectoryName: string, createUserRequest: CreateUserRequest) => ({ userDirectoryName, createUserRequest }),
});
