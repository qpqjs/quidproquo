/* eslint-disable qpq/one-export-per-file */
// Template-literal typing for ISO-8601 timestamps
// (from https://gist.github.com/MrChocolatine/367fb2a35d02f6175cc8ccb3d3a20054)
//
// Each `${number}` placeholder accepts any numeric text, so these types catch a missing part, a separator in the wrong
// place or letters, never an out-of-range value: '99' is a TMonth and '1.5' a THours. Check values at runtime.

/** The four-digit year of an ISO 8601 date, such as `2026`. */
export type TYear = `${number}${number}${number}${number}`;

/** The two-digit month of an ISO 8601 date, `01` to `12`. */
export type TMonth = `${number}${number}`;

/** The two-digit day of the month of an ISO 8601 date, `01` to `31`. */
export type TDay = `${number}${number}`;

/** The two-digit hour of an ISO 8601 time on a 24-hour clock, `00` to `23`; also the hours of a UtcOffset. */
export type THours = `${number}${number}`;

/** The two-digit minute of an ISO 8601 time, `00` to `59`; also the minutes of a UtcOffset. */
export type TMinutes = `${number}${number}`;

/** The two-digit second of an ISO 8601 time, `00` to `59`. */
export type TSeconds = `${number}${number}`;

/** The three-digit millisecond of an ISO 8601 time, `000` to `999`. */
export type TMilliseconds = `${number}${number}${number}`;

/**
 * Represent a string like `2021-01-08`
 */
export type TDateISODate = `${TYear}-${TMonth}-${TDay}`;

/**
 * Represent a string like `14:42:34.678`
 */
export type TDateISOTime = `${THours}:${TMinutes}:${TSeconds}.${TMilliseconds}`;

/**
 * Represent a string like `2021-01-08T14:42:34.678Z` (format: ISO 8601).
 *
 * It is not possible to type more precisely (list every possible values for months, hours etc) as
 * it would result in a warning from TypeScript:
 *   "Expression produces a union type that is too complex to represent. ts(2590)
 */
export type QpqIsoDateTime = `${TDateISODate}T${TDateISOTime}Z`;

/**
 * A fixed offset from UTC as `±HH:MM` ('+10:00', '+09:30', '-03:30'). Fixed: it never follows daylight saving.
 */
export type UtcOffset = `${'+' | '-'}${THours}:${TMinutes}`;
