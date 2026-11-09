import { reportSpanMonthCount } from './reportSpanMonthCount';

/** The local months (`YYYY-MM`) a span of days touches, in order: the month documents a read of it must read. */
export const reportSpanMonths = (from: string, to: string): string[] => {
  const first = Number(from.slice(0, 4)) * 12 + Number(from.slice(5, 7)) - 1;

  return Array.from({ length: Math.max(0, reportSpanMonthCount(from, to)) }, (_, index) => {
    const year = Math.floor((first + index) / 12);

    return `${String(year).padStart(4, '0')}-${String(first + index - year * 12 + 1).padStart(2, '0')}`;
  });
};
