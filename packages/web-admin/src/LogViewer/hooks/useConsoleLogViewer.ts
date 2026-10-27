import { StoryResult } from 'quidproquo-core';

import { useMemo } from 'react';

export const useConsoleLogViewer = (logs: StoryResult<any>['logs']) => {
  const formattedLogs = useMemo(() => {
    if (!logs) {
      return null;
    }

    return logs.map((log) => ({
      time: new Date(log.t).toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      args: log.a,
    }));
  }, [logs]);

  return { formattedLogs };
};
