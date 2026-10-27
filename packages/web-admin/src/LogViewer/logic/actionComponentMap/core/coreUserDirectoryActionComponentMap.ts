import { UserDirectoryActionType } from 'quidproquo-core';

const coreUserDirectoryActionComponentMap: Record<string, string[]> = {
  [UserDirectoryActionType.AuthenticateUser]: ['askUserDirectoryAuthenticateUser', 'userDirectoryName', 'authenticateUserRequest'],
  [UserDirectoryActionType.ForgotPassword]: ['askUserDirectoryForgotPassword', 'userDirectoryName', 'username'],
  [UserDirectoryActionType.ConfirmForgotPassword]: ['askUserDirectoryConfirmForgotPassword', 'userDirectoryName', 'code', 'username', 'password'],
  [UserDirectoryActionType.CreateUser]: ['askUserDirectoryCreateUser', 'userDirectoryName', 'createUserRequest'],
  [UserDirectoryActionType.RequestEmailVerification]: ['askUserDirectoryRequestEmailVerification', 'userDirectoryName', 'accessToken'],
  [UserDirectoryActionType.ConfirmEmailVerification]: ['askUserDirectoryConfirmEmailVerification', 'code', 'accessToken'],
  [UserDirectoryActionType.ReadAccessToken]: ['askUserDirectoryReadAccessToken', 'userDirectoryName', 'ignoreExpiration'],
  [UserDirectoryActionType.SetAccessToken]: ['askUserDirectorySetAccessToken', 'userDirectoryName', 'accessToken'],
  [UserDirectoryActionType.DecodeAccessToken]: ['askUserDirectoryDecodeAccessToken', 'userDirectoryName', 'ignoreExpiration', 'accessToken'],
  [UserDirectoryActionType.RespondToAuthChallenge]: ['askUserDirectoryRespondToAuthChallenge', 'userDirectoryName', 'authChallenge'],
  [UserDirectoryActionType.GetUserAttributes]: ['askUserDirectoryGetUserAttributes', 'userDirectoryName', 'username'],
  [UserDirectoryActionType.GetUserAttributesByUserId]: ['askUserDirectoryGetUserAttributesByUserId', 'userDirectoryName', 'userId'],
  [UserDirectoryActionType.SetUserAttributes]: ['askUserDirectorySetUserAttributes', 'userDirectoryName', 'username', 'userAttributes'],
  [UserDirectoryActionType.ChangePassword]: ['askUserDirectoryChangePassword', 'oldPassword', 'newPassword', 'accessToken'],
  [UserDirectoryActionType.SetPassword]: ['askUserDirectorySetPassword', 'userDirectoryName', 'username', 'newPassword'],
  [UserDirectoryActionType.GetUsers]: ['askUserDirectoryGetUsers', 'userDirectoryName', 'nextPageKey'],
  [UserDirectoryActionType.RefreshToken]: ['askUserDirectoryRefreshToken', 'userDirectoryName', 'refreshToken'],
  [UserDirectoryActionType.AssociateSoftwareToken]: ['askUserDirectoryAssociateSoftwareToken', 'userDirectoryName', 'session'],
  // 'attribueName' / 'attribueValue' match the (misspelled) payload keys in core
  [UserDirectoryActionType.GetUsersByAttribute]: [
    'askUserDirectoryGetUsersByAttribute',
    'userDirectoryName',
    'attribueName',
    'attribueValue',
    'limit',
    'nextPageKey',
  ],
};

export default coreUserDirectoryActionComponentMap;
