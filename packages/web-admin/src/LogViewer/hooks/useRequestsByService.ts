import { useMemo } from 'react';

import { SearchParams } from '../types';

export const useRequestsByService = (logs: any[], searchParams: SearchParams) => {
  const data = useMemo(() => {
    const startTime = new Date(searchParams.startIsoDateTime).getTime();
    const endTime = new Date(searchParams.endIsoDateTime).getTime();
    const interval = (endTime - startTime) / 10;

    const services = [...new Set(logs.map((log) => log.moduleName))];

    const buckets = Array.from({ length: 10 }, (_, i) => ({
      time: new Date(startTime + i * interval).toLocaleString(),
      ...services.reduce((acc, service) => ({ ...acc, [service]: 0 }), {}),
    }));

    logs.forEach((log) => {
      const logTime = new Date(log.startedAt).getTime();
      const bucketIndex = Math.floor((logTime - startTime) / interval);

      if (bucketIndex >= 0 && bucketIndex < 10) {
        buckets[bucketIndex][log.moduleName]++;
      }
    });

    return buckets;
  }, [logs, searchParams]);

  return data;
};
