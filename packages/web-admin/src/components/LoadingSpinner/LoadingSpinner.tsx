import React, { ReactNode, useMemo } from 'react';
import { Box, CircularProgress } from '@mui/material';

interface LoadingSpinnerProps {
  isLoading: boolean;
  size?: number;
  children?: ReactNode;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ isLoading, size = 200, children }) => {
  const sx = useMemo(
    () => ({
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: `${size}px`,
      width: '100%',
      p: 2,
    }),
    [size],
  );

  if (isLoading) {
    return (
      <Box sx={sx}>
        <CircularProgress size={size / 2} />
      </Box>
    );
  }

  return <>{children}</>;
};
