type Division = {
  amount: number;
  unit: Intl.RelativeTimeFormatUnit;
};

// Each amount is "how many of this unit make up one of the next unit".
const DIVISIONS: Division[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Number.POSITIVE_INFINITY, unit: 'years' },
];

/**
 * Formats the distance between `date` and `now` as a relative phrase
 * (e.g. "5 minutes ago", "in 2 hours") using the native Intl.RelativeTimeFormat.
 * Past dates are negative, future dates are positive.
 */
export const formatTimeAgo = (date: Date, now: Date = new Date(), locale?: string | string[]): string => {
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  // Seconds between the two dates; negative for the past.
  let duration = (date.getTime() - now.getTime()) / 1000;

  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return formatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return formatter.format(Math.round(duration), 'years');
};

/**
 * How long until the relative phrase could next change, so callers can
 * re-render no more often than necessary.
 */
export const getTimeAgoUpdateIntervalMs = (date: Date, now: Date = new Date()): number => {
  const seconds = Math.abs((date.getTime() - now.getTime()) / 1000);

  if (seconds < 60) {
    return 1000; // seconds tick over
  }
  if (seconds < 60 * 60) {
    return 60 * 1000; // minutes tick over
  }
  if (seconds < 60 * 60 * 24) {
    return 60 * 60 * 1000; // hours tick over
  }
  return 60 * 60 * 24 * 1000; // days or coarser
};
