import { LogDisableEventHistoryActionPayload } from 'quidproquo-core';

import { Box, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';

import { ActionComponent } from '../types';

export const CoreLogDisableEventHistoryCustomAction: ActionComponent<LogDisableEventHistoryActionPayload> = ({ action }) => {
  if (!action.payload) {
    return null;
  }

  const { reason } = action.payload;

  return (
    <Box sx={{ width: '100%', my: 1 }}>
      <Alert severity={'warning'}>
        <Typography fontWeight="bold" variant="body1">
          {reason}
        </Typography>
      </Alert>
    </Box>
  );
};
