import { useContext } from 'react';

import { LoadingContext } from '../private';

export const useIsLoading = (): boolean => {
  const isLoading = useContext(LoadingContext);
  return isLoading;
};
