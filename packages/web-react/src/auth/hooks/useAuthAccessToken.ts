import { useContext } from 'react';

import { authContext } from '../authContext';

export const useAuthAccessToken = () => {
  const authState = useContext(authContext);

  // TODO: dont return access token if it has expired.

  return authState.authenticationInfo?.accessToken;
};
