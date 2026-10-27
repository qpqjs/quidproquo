import { StoryResultMetadata } from 'quidproquo-core';

import { useMemo } from 'react';

export const useErrorsByType = (logs: StoryResultMetadata[]) => {
  const data = useMemo(() => {
    const errorCounts: Record<string, { count: number; errorText: string }> = {};

    logs.forEach((log) => {
      if (log.error) {
        const errorText = log.error || '';
        const truncatedErrorText = errorText.length > 100 ? errorText.slice(0, 100) + '...' : errorText;

        errorCounts[truncatedErrorText] = errorCounts[truncatedErrorText] || {
          count: 0,
          errorText: truncatedErrorText,
        };

        errorCounts[truncatedErrorText].count++;
      }
    });

    return Object.values(errorCounts).sort((a, b) => b.count - a.count);
  }, [logs]);

  console.log(data);

  return data.slice(0, 10);
};
