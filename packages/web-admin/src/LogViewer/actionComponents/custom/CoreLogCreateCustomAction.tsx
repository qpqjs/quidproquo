import { LogCreateActionPayload, LogLevelEnum, resolveLookupText } from 'quidproquo-core';

import { AlertColor, Box, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';

import { AnyVariableView, genericFunctionRendererStyles } from '../genericActionRenderer';
import { ActionComponent } from '../types';

const getSeverity = (logLevel: LogLevelEnum): AlertColor => {
  switch (logLevel) {
    case LogLevelEnum.Fatal:
    case LogLevelEnum.Error:
      return 'error';
    case LogLevelEnum.Warn:
      return 'warning';
    case LogLevelEnum.Info:
      return 'info';
    case LogLevelEnum.Debug:
    case LogLevelEnum.Trace:
      return 'success';
    default:
      return 'info';
  }
};

export const CoreLogCreateCustomAction: ActionComponent<LogCreateActionPayload> = ({ action, expanded }) => {
  if (!action.payload) {
    return null;
  }

  const { logLevel, msg, data } = action.payload;

  return (
    <Box sx={{ width: '100%', my: 1 }}>
      <Alert severity={getSeverity(logLevel)}>
        <Typography fontWeight="bold" variant="body1">
          {resolveLookupText(logLevel, LogLevelEnum)}
        </Typography>
        <Typography variant="body1">{msg}</Typography>
        {data && (
          <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap' }} variant="body2">
            <pre style={genericFunctionRendererStyles.pre}>
              <AnyVariableView expanded={expanded} value={data} />
            </pre>
          </Typography>
        )}
      </Alert>
    </Box>
  );
};
