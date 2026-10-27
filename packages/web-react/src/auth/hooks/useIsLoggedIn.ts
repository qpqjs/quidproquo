import { useAuthAccessToken } from './useAuthAccessToken';

export const useIsLoggedIn = () => {
  const accessToken = useAuthAccessToken();

  return !!accessToken;
};
