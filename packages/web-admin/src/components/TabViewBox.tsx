import { ReactNode } from 'react';
import { Box } from '@mui/material';

interface TabViewBoxProps {
  children?: ReactNode;
  header?: () => ReactNode;
  body?: () => ReactNode;
}

export const TabViewBox: React.FC<TabViewBoxProps> = ({ children, header, body }: TabViewBoxProps) => {
  return (
    <Box
      sx={{
        width: '100%',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {header && <Box sx={{ mb: 2 }}>{header()}</Box>}
      {body && <Box sx={{ flex: 1, overflow: 'auto' }}>{body()}</Box>}
      {!header && !body && children}
    </Box>
  );
};
