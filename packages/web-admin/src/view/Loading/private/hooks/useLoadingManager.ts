import { useMemo, useRef, useState } from 'react';

import { LoadingApi } from '../../types';
import { getIsLoadingFromLoadingCount } from '../logic';

export const useLoadingManager = (): [boolean, LoadingApi] => {
  const [isLoading, setIsLoading] = useState(false);
  const loadingCountRef = useRef(0);

  // This does not need to be cached (useFastCallback) as refs don't change
  const updateLoadingCounter = (dir: number) => {
    loadingCountRef.current += dir;
    setIsLoading(getIsLoadingFromLoadingCount(loadingCountRef.current));
  };

  // This does not need to look at
  const api = useMemo(
    () => ({
      addLoading: () => updateLoadingCounter(1),
      removeLoading: () => updateLoadingCounter(-1),
    }),
    [],
  );

  return [isLoading, api];
};
