import { useContext } from 'react';

import { LoadingApiContext } from '../private';
import { LoadingApi } from '../types';

export const useLoadingApi = (): LoadingApi => {
  const loadingApi = useContext(LoadingApiContext);

  return loadingApi;
};
