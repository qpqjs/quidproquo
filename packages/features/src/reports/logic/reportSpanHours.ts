import { ReportSpan } from '../types/ReportSpan';

const HOURS_IN_DAY = 24;

/** The hourly cell keys of a one-day span, `YYYY-MM-DDTHH:00`, through its last hour when it has one (today against yesterday). */
export const reportSpanHours = (span: ReportSpan): string[] =>
  Array.from({ length: (span.lastHour ?? HOURS_IN_DAY - 1) + 1 }, (_, hour) => `${span.from}T${String(hour).padStart(2, '0')}:00`);
