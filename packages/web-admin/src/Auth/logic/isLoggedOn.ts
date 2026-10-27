import { AuthState } from './authTypes';

export function isLoggedOn(state: AuthState): boolean {
  const accessToken = state.authenticateUserResponse?.authenticationInfo?.accessToken;
  const expiresAtStr = state.authenticateUserResponse?.authenticationInfo?.expiresAt;

  if (!accessToken || !expiresAtStr) {
    return false;
  }

  const expiresAt = new Date(expiresAtStr).getTime();
  if (isNaN(expiresAt)) {
    return false;
  }

  const currentTime = Date.now();
  return expiresAt > currentTime;
}
