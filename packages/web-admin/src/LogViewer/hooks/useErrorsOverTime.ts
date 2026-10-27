import { useMemo } from 'react';

import { SearchParams } from '../types';

export const useErrorsOverTime = (logs: any[], searchParams: SearchParams) => {
  const data = useMemo(() => {
    const startTime = new Date(searchParams.startIsoDateTime).getTime();
    const endTime = new Date(searchParams.endIsoDateTime).getTime();
    const interval = (endTime - startTime) / 10;

    const buckets = Array.from({ length: 10 }, (_, i) => ({
      time: new Date(startTime + i * interval).toLocaleString(),
      errors: 0,
    }));

    logs.forEach((log) => {
      const logTime = new Date(log.startedAt).getTime();
      const bucketIndex = Math.floor((logTime - startTime) / interval);

      if (log.error && bucketIndex >= 0 && bucketIndex < 10) {
        buckets[bucketIndex].errors++;
      }
    });

    return buckets;
  }, [logs, searchParams]);

  return data;
};
