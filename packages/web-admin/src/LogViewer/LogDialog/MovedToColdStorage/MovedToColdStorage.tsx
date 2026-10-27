import React from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface MovedToColdStorageProps {
  guid: string;
}

export const MovedToColdStorage: React.FC<MovedToColdStorageProps> = ({ guid }) => {
  return (
    <Paper elevation={3} sx={{ padding: 2, borderRadius: 2 }}>
      <Typography color="textSecondary" variant="body1">
        The log you are requesting has been moved to <b>cold storage</b>. Please provide the following Correlation to an administrator if you would
        like it to be moved back to standard storage.
      </Typography>
      <Box mt={1}>
        <Typography color="primary" fontWeight="bold" variant="subtitle1">
          {guid}
        </Typography>
      </Box>
    </Paper>
  );
};
