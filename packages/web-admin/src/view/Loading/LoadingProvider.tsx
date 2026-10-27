import React from 'react';

import { LoadingApiContext, LoadingContext, useLoadingManager } from './private';

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, api] = useLoadingManager();

  return (
    <LoadingApiContext.Provider value={api}>
      <LoadingContext.Provider value={isLoading}>{children}</LoadingContext.Provider>
    </LoadingApiContext.Provider>
  );
};
