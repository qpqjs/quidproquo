import { StoryResult } from 'quidproquo-core';

import { Box, Typography } from '@mui/material';

interface LogRawJsonProps {
  log: StoryResult<any>;
}

export const LogRawJson = ({ log }: LogRawJsonProps) => {
  return (
    <Box sx={{ width: 1, p: 2 }}>
      <Typography gutterBottom variant="h6">
        Raw JSON
      </Typography>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{JSON.stringify(log, null, 2)}</pre>
    </Box>
  );
};
