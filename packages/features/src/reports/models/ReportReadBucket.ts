import { ReportCell } from './ReportCell';

/** One point of a view: its bucket key, its totals, and with a groupBy one series per value (zero where it had none). */
export type ReportReadBucket = ReportCell & {
  // The register's key text: `YYYY-MM-DDTHH:00`, the day, the Monday, or the first of the month or quarter.
  key: string;
  series?: Record<string, ReportCell>;
};
