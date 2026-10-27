import { Box } from '@mui/material';

import { AnyVariableView, genericFunctionRendererStyles } from '../genericActionRenderer';
import { ActionComponent, ActionComponentProps } from '../types';

export const CoreContextListCustomAction: ActionComponent<undefined> = ({ result, expanded }: ActionComponentProps<undefined>) => {
  return (
    <Box sx={{ width: '100%', my: 1 }}>
      <pre style={genericFunctionRendererStyles.pre}>
        <AnyVariableView expanded={expanded} value={result} />
      </pre>
    </Box>
  );
};
