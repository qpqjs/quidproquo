import React from 'react';
import { Box, CircularProgress } from '@mui/material';

import { useIsLoading } from '../../view';
import { LoadingProvider } from '../../view';
import { usePlatformDataFromPath } from './hooks';

interface LoadingBoxProps<T> {
  path: string;
  renderItem: (item: T) => React.ReactNode;
  renderLoading?: () => React.ReactNode;
}

const LoadingBoxInternal = <T,>({ path, renderItem, renderLoading }: LoadingBoxProps<T>) => {
  const isLoading = useIsLoading();
  const data: T | null = usePlatformDataFromPath<T>(path);

  let reactNode: JSX.Element = <div>Error: Data could not be loaded</div>;

  if (isLoading) {
    reactNode = renderLoading ? (
      <>{renderLoading()}</>
    ) : (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
          width: '100%',
          p: 2,
        }}
      >
        <CircularProgress size={100} />
      </Box>
    );
  } else if (data) {
    reactNode = <>{renderItem(data)}</>;
  }

  return <LoadingProvider>{reactNode}</LoadingProvider>;
};

export const LoadingBox = <T,>({ path, renderItem, renderLoading }: LoadingBoxProps<T>) => {
  return (
    <LoadingProvider>
      <LoadingBoxInternal<T> path={path} renderItem={renderItem} renderLoading={renderLoading} />
    </LoadingProvider>
  );
};
