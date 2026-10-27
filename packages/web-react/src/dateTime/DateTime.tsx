import { memo, useMemo } from 'react';

import { useTimeAgo } from './hooks';

type DateInput = { isoDateTime: string } | { unixTimestampMs: number } | { date: Date };

export type DateTimeProps = DateInput & {
  /** Locale(s) for both the absolute and relative formatting. Defaults to the runtime locale. */
  locale?: string | string[];
  /** Options for the absolute date/time. Defaults to a short date + time. */
  dateTimeFormatOptions?: Intl.DateTimeFormatOptions;
  /** Show the "x minutes ago" label alongside the absolute time. Defaults to true. */
  showTimeAgo?: boolean;
  /** Hide the date portion of the absolute time. Defaults to false. */
  hideDate?: boolean;
  /** Hide the time portion of the absolute time. Defaults to false. */
  hideTime?: boolean;
  /** Hide the "x minutes ago" label. Takes precedence over showTimeAgo. Defaults to false. */
  hideTimeAgo?: boolean;
  /** Render each part on its own line instead of inline. Defaults to true. */
  isMultiline?: boolean;
  /** What to render when the date is missing/invalid (e.g. an empty isoDateTime). Defaults to "—". */
  placeholder?: React.ReactNode;
  className?: string;
};

const DEFAULT_DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: '2-digit',
};

const DEFAULT_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
};

const DATE_OPTION_KEYS: (keyof Intl.DateTimeFormatOptions)[] = ['weekday', 'era', 'year', 'month', 'day'];
const TIME_OPTION_KEYS: (keyof Intl.DateTimeFormatOptions)[] = ['hour', 'minute', 'second', 'dayPeriod', 'timeZoneName'];

const pickOptions = (
  options: Intl.DateTimeFormatOptions | undefined,
  keys: (keyof Intl.DateTimeFormatOptions)[],
): Intl.DateTimeFormatOptions | undefined => {
  if (!options) {
    return undefined;
  }

  const picked = keys.reduce<Intl.DateTimeFormatOptions>((acc, key) => {
    if (options[key] !== undefined) {
      (acc as Record<string, unknown>)[key] = options[key];
    }
    return acc;
  }, {});

  return Object.keys(picked).length > 0 ? picked : undefined;
};

const DateTimeComponent: React.FC<DateTimeProps> = (props) => {
  const {
    locale,
    dateTimeFormatOptions,
    showTimeAgo = true,
    hideDate = false,
    hideTime = false,
    hideTimeAgo = false,
    isMultiline = true,
    placeholder = '—',
    className,
  } = props;

  // Stable primitive key so a fresh props object doesn't churn the memo.
  // Both the ISO string and the epoch-ms number are valid Date constructor inputs.
  const dateKey = 'isoDateTime' in props ? props.isoDateTime : 'unixTimestampMs' in props ? props.unixTimestampMs : props.date.getTime();

  const date = useMemo(() => new Date(dateKey), [dateKey]);
  const isValidDate = !Number.isNaN(date.getTime());

  const formattedDate = useMemo(
    () => (hideDate ? '' : date.toLocaleDateString(locale, pickOptions(dateTimeFormatOptions, DATE_OPTION_KEYS) ?? DEFAULT_DATE_OPTIONS)),
    [date, locale, dateTimeFormatOptions, hideDate],
  );

  const formattedTime = useMemo(
    () => (hideTime ? '' : date.toLocaleTimeString(locale, pickOptions(dateTimeFormatOptions, TIME_OPTION_KEYS) ?? DEFAULT_TIME_OPTIONS)),
    [date, locale, dateTimeFormatOptions, hideTime],
  );

  const timeAgo = useTimeAgo(date, locale);

  const formattedDateTime = [formattedDate, formattedTime].filter(Boolean).join(' ');
  const displayTimeAgo = showTimeAgo && !hideTimeAgo;

  // A missing/invalid date (e.g. an empty isoDateTime) renders the placeholder instead of
  // an "Invalid Date" string or crashing the relative-time formatter.
  if (!isValidDate) {
    return <time className={className}>{placeholder}</time>;
  }

  return (
    <time className={className} dateTime={date.toISOString()} title={date.toLocaleString(locale)}>
      {isMultiline ? (
        <>
          {formattedDateTime ? <div>{formattedDateTime}</div> : null}
          {displayTimeAgo ? <div>{timeAgo}</div> : null}
        </>
      ) : (
        <>
          {formattedDateTime}
          {displayTimeAgo ? ` (${timeAgo})` : ''}
        </>
      )}
    </time>
  );
};

export const DateTime = memo(DateTimeComponent);
