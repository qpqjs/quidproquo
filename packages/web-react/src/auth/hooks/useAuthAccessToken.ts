import { useContext } from 'react';

import { authContext } from '../authContext';

export const useAuthAccessToken = () => {
  const authState = useContext(authContext);

  // TODO: @joe-coady: do not return access token if it has expired.

  return authState.authenticationInfo?.accessToken;
};
