import { ReactNode } from 'react';
import { Grid } from '@mui/material';

interface GridItemProps {
  children: ReactNode;
  xs?: 'auto' | number;
}

export const GridItem: React.FC<GridItemProps> = ({ children, xs = 12 }: GridItemProps) => {
  return (
    <Grid item xs={xs}>
      {children}
    </Grid>
  );
};
