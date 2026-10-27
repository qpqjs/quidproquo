import { useMemo } from 'react';

import { processLog } from '../logic';

export const useLogEvents = (log: any) => {
  const events = useMemo(() => {
    if (log) {
      return processLog(log);
    } else {
      return [];
    }
  }, [log]);

  return events;
};
