import React from 'react';
import { Checkbox, FormControlLabel } from '@mui/material';

import { LogDetails } from '../../../LogDetails';
import { AsyncStoryState, LogDialogState, LogDialogStateApi } from '../../hooks';
import { MovedToColdStorage } from '../../MovedToColdStorage';

interface LogDetailsTabProps {
  log: AsyncStoryState;

  logDialogState: LogDialogState;
  logDialogStateApi: LogDialogStateApi;
}

export const LogDetailsTab: React.FC<LogDetailsTabProps> = ({
  log,
  logDialogState: { hideFastActions, orderByDuration },
  logDialogStateApi: { setHideFastActions, setOrderByDuration },
}) => {
  if (log.isLoading) {
    return <div>Loading...</div>;
  }

  if (log.isLogInColdStorage) {
    return <MovedToColdStorage guid={log.logCorrelation} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row-reverse',
      }}
    >
      <div>
        <FormControlLabel
          control={<Checkbox checked={hideFastActions} onChange={(event) => setHideFastActions(event.target.checked)} />}
          label="Hide Fast Actions"
        />
        <FormControlLabel
          control={<Checkbox checked={orderByDuration} onChange={(event) => setOrderByDuration(event.target.checked)} />}
          label="Order by Duration"
        />
      </div>
      <LogDetails hideFastActions={hideFastActions} log={log.log} orderByDuration={orderByDuration} />
    </div>
  );
};
