import { StoryResult } from 'quidproquo-core';

import { useState } from 'react';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';

import { AnyVariableView, genericFunctionRendererStyles } from './actionComponents';

interface LogSummaryReturnProps {
  log: StoryResult<any>;
}

export const LogSummaryReturn = ({ log }: LogSummaryReturnProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <Box alignItems="center" display="flex">
        <Typography gutterBottom variant="h6">
          {log.error ? 'Thrown Error' : 'Returned'}
        </Typography>
        <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        <pre style={genericFunctionRendererStyles.pre}>
          {log.error ? <AnyVariableView expanded={expanded} value={log.error} /> : <AnyVariableView expanded={expanded} value={log.result} />}
        </pre>
      </pre>
    </div>
  );
};
