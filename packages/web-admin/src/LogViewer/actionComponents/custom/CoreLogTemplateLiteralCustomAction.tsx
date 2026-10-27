import { DecomposedStringPrimitive, LogTemplateLiteralActionPayload } from 'quidproquo-core';

import React from 'react';
import { Box, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';

import { AnyVariableView } from '../genericActionRenderer';
import { ActionComponent } from '../types';

export const CoreLogTemplateLiteralCustomAction: ActionComponent<LogTemplateLiteralActionPayload> = ({ action, expanded }) => {
  if (!action.payload) {
    return null;
  }

  const {
    messageParts: [strings, values],
  } = action.payload;

  return (
    <Box sx={{ width: '100%', my: 1 }}>
      <Alert severity={'info'}>
        <Typography variant="body1">
          {values.reduce(
            (preComp: React.ReactNode, value: DecomposedStringPrimitive, index: number) => (
              <>
                {preComp}
                {<AnyVariableView expanded={expanded} hideStringQuotes={true} value={value} />}
                {<span>{strings[index + 1]}</span>}
              </>
            ),
            <span>{strings[0]}</span>,
          )}
        </Typography>
      </Alert>
    </Box>
  );
};
