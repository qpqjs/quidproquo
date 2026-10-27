import { formatTimeAgo, getTimeAgoUpdateIntervalMs } from 'quidproquo-web';

import { useEffect, useMemo, useState } from 'react';

/**
 * Returns a relative time phrase for `date` (e.g. "5 minutes ago") that
 * updates itself over time. The re-render cadence adapts to the age of the
 * date, so recent times tick every second and older ones only update hourly.
 */
export const useTimeAgo = (date: Date, locale?: string | string[]): string => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const schedule = () => {
      timeoutId = setTimeout(
        () => {
          setNow(new Date());
          schedule();
        },
        getTimeAgoUpdateIntervalMs(date, new Date()),
      );
    };

    schedule();

    return () => clearTimeout(timeoutId);
  }, [date]);

  return useMemo(() => formatTimeAgo(date, now, locale), [date, now, locale]);
};
