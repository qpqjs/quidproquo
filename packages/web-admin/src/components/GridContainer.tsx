import { ReactNode } from 'react';
import { Grid } from '@mui/material';

interface GridContainerProps {
  children: ReactNode;
  spacing?: number;
  xs?: 'auto' | number;
}

export const GridContainer: React.FC<GridContainerProps> = ({ children, spacing = 2, xs = 'auto' }: GridContainerProps) => {
  return (
    <Grid container spacing={spacing} xs={xs}>
      {children}
    </Grid>
  );
};
