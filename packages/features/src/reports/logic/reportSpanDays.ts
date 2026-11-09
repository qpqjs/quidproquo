import { ReportSpan } from '../types/ReportSpan';
import { addReportDays } from './addReportDays';
import { reportDaysBetween } from './reportDaysBetween';

/** Every local day of a span, in order. */
export const reportSpanDays = (span: ReportSpan): string[] =>
  Array.from({ length: Math.max(0, reportDaysBetween(span.from, span.to) + 1) }, (_, index) => addReportDays(span.from, index));
